const PrimaryBtn = ({ text, onClick, className = '' }) => {
  return (
    <button
    type='submit'
      onClick={onClick}
      className={`bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-300 ${className}`}
    >
      {text}
    </button>
  );
};


export default PrimaryBtn;