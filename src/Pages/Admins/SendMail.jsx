import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuSearch, LuMail, LuSend, LuPlus, LuTrash2, LuX, LuFileText, LuUser } from 'react-icons/lu';
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { sendMail } from "../../Services/apiServices";
import { toast } from "react-toastify";

// Email Templates stored in localStorage
const EMAIL_TEMPLATES_KEY = 'zelova_email_templates';

const getStoredTemplates = () => {
  try {
    const templates = localStorage.getItem(EMAIL_TEMPLATES_KEY);
    return templates ? JSON.parse(templates) : [];
  } catch {
    return [];
  }
};

const saveTemplates = (templates) => {
  localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(templates));
};

// Template Card
const TemplateCard = ({ template, onSelect, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -10 }}
    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
    onClick={() => onSelect(template)}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-slate-900 text-sm truncate">{template.name}</h4>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{template.subject}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-all"
      >
        <LuTrash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </motion.div>
);

// Save Template Modal
const SaveTemplateModal = ({ isOpen, onClose, onSave, defaultSubject, defaultMessage }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(defaultSubject || '');
  const [message, setMessage] = useState(defaultMessage || '');

  useEffect(() => {
    setSubject(defaultSubject || '');
    setMessage(defaultMessage || '');
  }, [defaultSubject, defaultMessage, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill all template fields');
      return;
    }
    onSave({ name, subject, message });
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Save as Template</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <LuX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g., Welcome Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Email message"
            />
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Template
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SendMail = () => {
  const [formData, setFormData] = useState({ to: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchTemplate, setSearchTemplate] = useState('');

  useEffect(() => {
    setTemplates(getStoredTemplates());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({ to: '', subject: '', message: '' });
  };

  const handleSubmit = async () => {
    if (!formData.to || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await sendMail({
        email: formData.to,
        subject: formData.subject,
        message: formData.message
      });

      if (response.data.status === 'Success') {
        handleClear();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString()
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleDeleteTemplate = (id) => {
    if (!confirm('Delete this template?')) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleSelectTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.message
    }));
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTemplate.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSearchBar />

      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Send Email</h1>
          <p className="text-slate-500 text-sm mt-1">Send individual emails to users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LuFileText className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-slate-900">Templates</h2>
                  </div>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!formData.subject && !formData.message}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save current as template"
                  >
                    <LuPlus className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTemplate}
                    onChange={(e) => setSearchTemplate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="p-3 max-h-[400px] overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <LuFileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      {templates.length === 0 ? 'No templates saved' : 'No templates found'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Fill in the form and click + to save as template
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {filteredTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={handleSelectTemplate}
                          onDelete={handleDeleteTemplate}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <LuMail className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-900">Compose Email</h2>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Recipient */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <LuUser className="w-4 h-4" />
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter recipient's email address"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter email subject"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={8}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Enter your message"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LuSend className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={loading}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <SaveTemplateModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveTemplate}
            defaultSubject={formData.subject}
            defaultMessage={formData.message}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendMail;