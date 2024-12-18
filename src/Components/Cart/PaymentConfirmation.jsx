import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import { BsCashCoin } from 'react-icons/bs';
import { RiSecurePaymentLine } from 'react-icons/ri';
import { SiZcash } from 'react-icons/si';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { completeOrder } from '../../Redux/slices/orderSlice';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../../Services/apiServices';
import { toast } from 'react-hot-toast';
import { createRazorpayOrder , verifyRazorpayPayment, getZcoinsData } from '../../Services/apiServices';
import { useQueryClient } from '@tanstack/react-query';

const PaymentConfirmation = ({
    isOpen,
    onClose,
    items,
    totalAmount,
    tax,
    platformFee,
    appliedCoupon,
    totalSavings,
    isFreeDelivery,
    deliveryFee,
    offerSavings,
    selectedAddress,
    selectedPhoneNumber,
    restaurantId,
    cartId
}) => {
    const [selectedPayment, setSelectedPayment] = useState('COD');
    const [loading, setLoading] = useState(false);
    const [coinBalance, setCoinBalance] = useState(0);
    const finalTotal = totalAmount + deliveryFee + tax + platformFee - (appliedCoupon?.discountAmount || 0);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.userData.data);
    const queryClient = useQueryClient();

    useEffect(() => {
        const fetchCoinBalance = async () => {
            try {
                const response = await getZcoinsData();
                setCoinBalance(response.data.zcoins.balance);
            } catch (error) {
                console.error('Error fetching coin balance:', error);
            }
        };

        if (isOpen) {
            fetchCoinBalance();
        }
    }, [isOpen]);

    const paymentOptions = [
        {
            id: 'COD',
            name: 'Cash on Delivery',
            icon: <BsCashCoin className="text-xl" />,
            description: 'Pay with cash upon delivery'
        },
        {
            id: 'RAZORPAY',
            name: 'RazorPay',
            icon: <RiSecurePaymentLine className="text-xl" />,
            description: 'Pay securely online'
        },
        {
            id: 'ZCOINS',
            name: 'Zcoins',
            icon: <SiZcash className="text-xl" />,
            description: `Pay with your Zcoins`,
            disabled: coinBalance < finalTotal
        }
    ];

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    const prepareOrderDetails = (paymentMethod) => {
        return {
            user: {
                name: userData?.fullname,
                phoneNumber: selectedPhoneNumber,
                address: selectedAddress
            },
            restaurantId: restaurantId._id,
            cartId: cartId,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            items: items.map(item => ({
                name: item.item.name,
                quantity: item.quantity,
                price: item.itemPrice,
                totalPrice: item.itemPrice * item.quantity,
                customizations: item.selectedCustomizations?.map(customization => ({
                    fieldName: customization.fieldName,
                    selectedOption: customization.options
                })) || []
            })),
            billDetails: {
                itemTotal: totalAmount,
                platformFee,
                deliveryFee: isFreeDelivery ? 0 : deliveryFee,
                tax,
                discount: appliedCoupon ? appliedCoupon.discountAmount : 0,
                offerSavings,
                totalSavings,
                finalAmount: finalTotal,
                paymentMethod
            }
        };
    };

    const handleRazorpayPayment = async () => {
        try {
            setLoading(true);
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error('Failed to load payment gateway');
                return;
            }

            const response = await createRazorpayOrder({ amount: finalTotal });
            
            if (!response.data?.success) {
                toast.error('Failed to create order');
                return;
            }

            const orderDetails = prepareOrderDetails('RAZORPAY');

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: response.data.order.amount,
                currency: response.data.order.currency,
                name: "Zelova",
                description: "Food Order Payment",
                order_id: response.data.order.id,
                handler: async function (response) {
                    try {
                        const verificationResponse = await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderDetails
                        });

                        if (verificationResponse.data?.success) {
                            toast.success('Payment successful!');
                            dispatch(completeOrder());
                            // Invalidate cart queries to clear the UI state
                            queryClient.invalidateQueries(['cart']);
                            queryClient.invalidateQueries(['totalItems']);
                            queryClient.invalidateQueries(['totalPrice']);
                            navigate('/order-success', {
                                state: {
                                    orderId: verificationResponse.data.order.orderId,
                                    coinsWon: verificationResponse.data.coinsEarned
                                }
                            });
                            onClose();
                        } else {
                            toast.error('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Error verifying payment:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: userData?.fullname,
                    email: userData?.email,
                    contact: selectedPhoneNumber,
                },
                config: {
                    display: {
                        blocks: {
                            otpEmail: {
                                name: 'Pay using Email OTP',
                                instruments: [
                                    {
                                        method: 'otp',
                                        channels: ['email'],
                                        value: userData?.email
                                    }
                                ]
                            },
                            otpSMS: {
                                name: 'Pay using SMS OTP',
                                instruments: [
                                    {
                                        method: 'otp',
                                        channels: ['sms'],
                                        value: selectedPhoneNumber
                                    }
                                ]
                            }
                        },
                        sequence: ['block.otpEmail', 'block.otpSMS'],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                    },
                    confirm_close: true,
                    escape: false
                },
                theme: {
                    color: "#f97316"
                },
                retry: {
                    enabled: true,
                    max_count: 3
                },
                notes: {
                    email: userData?.email,
                    phoneNumber: selectedPhoneNumber
                },
                method: ['card', 'netbanking', 'upi']
            };
            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();

        } catch (error) {
            console.error('Error during payment:', error);
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleProceedToPay = async () => {
        if (!selectedPhoneNumber?.trim()) {
            toast.error('Please enter a phone number before proceeding');
            return;
        }

        const payableAmount = selectedPayment === 'ZCOINS' ? Math.ceil(finalTotal) : finalTotal;

        const orderDetails = prepareOrderDetails(selectedPayment);
        orderDetails.billDetails.finalAmount = payableAmount;

        if (selectedPayment === 'ZCOINS') {
            if (coinBalance < payableAmount) {
                toast.error('Insufficient Zcoins balance');
                return;
            }
            try {
                setLoading(true);
                const response = await placeOrder(orderDetails);
                dispatch(completeOrder());
                queryClient.invalidateQueries(['cart']);
                queryClient.invalidateQueries(['totalItems']);
                queryClient.invalidateQueries(['totalPrice']);
                queryClient.invalidateQueries(['zcoins']);
                navigate('/order-success', { 
                    state: { 
                        orderId: response.data.order.orderId,
                        coinsWon: response.data.coinsEarned
                    } 
                });
                onClose();
            } catch (error) {
                console.error('Error placing order:', error);
                toast.error('Failed to place order');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (selectedPayment === 'COD') {
            try {
                setLoading(true);
                const response = await placeOrder(orderDetails);
                dispatch(completeOrder());
                queryClient.invalidateQueries(['cart']);
                queryClient.invalidateQueries(['totalItems']);
                queryClient.invalidateQueries(['totalPrice']);
                navigate('/order-success', { 
                    state: { 
                        orderId: response.data.order.orderId,
                        coinsWon: response.data.coinsEarned
                    } 
                });
                onClose();
            } catch (error) {
                console.error('Error placing order:', error);
                toast.error('Failed to place order');
            } finally {
                setLoading(false);
            }
        } else if (selectedPayment === 'RAZORPAY') {
            handleRazorpayPayment();
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Confirm Order</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600 mb-2">Total Amount to Pay</p>
                            <div className="text-5xl font-bold">
                                ₹{finalTotal.toFixed(2)}
                            </div>
                            {totalSavings > 0 && (
                                <p className="text-green-600 text-sm mt-2">
                                    You saved ₹{totalSavings.toFixed(2)} on this order!
                                </p>
                            )}
                            <p className="text-md text-gray-800 mt-2">
                                Your Zcoin Balance: <span className="font-bold">{coinBalance}</span> coins
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item._id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {item.item.name} x {item.quantity}
                                        </span>
                                        <span className="font-medium">₹{(item.itemPrice * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 my-2 pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Platform Fee</span>
                                        <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Delivery Fee</span>
                                            {isFreeDelivery && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    Free Delivery
                                                </span>
                                            )}
                                        </div>
                                        <span className="flex items-center gap-2">
                                            {isFreeDelivery ? (
                                                <>
                                                    <span className="text-gray-400 line-through">₹{deliveryFee.toFixed(2)}</span>
                                                    <span className="text-green-600">FREE</span>
                                                </>
                                            ) : (
                                                `₹${deliveryFee.toFixed(2)}`
                                            )}
                                        </span>
                                    </div>
                                    {offerSavings > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Offer Discount</span>
                                            <span>-₹{offerSavings.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Coupon Discount ({appliedCoupon.code})</span>
                                            <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">Select Payment Method</h3>
                            {paymentOptions.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => !option.disabled && setSelectedPayment(option.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedPayment === option.id
                                            ? 'border-orange-400 bg-orange-50'
                                            : option.disabled
                                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                            : 'border-gray-200 hover:border-orange-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${
                                            selectedPayment === option.id
                                                ? 'bg-orange-100 text-orange-600'
                                                : option.disabled
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {option.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">{option.name}</h4>
                                            <p className="text-sm text-gray-500">{option.description}</p>
                                            {option.disabled && (
                                                <p className="text-sm text-red-500 mt-1">
                                                    Insufficient coin balance for this order
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleProceedToPay}
                            disabled={loading}
                            className={`w-full py-4 rounded-lg text-white font-medium transition-all ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-primary/90'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                `Confirm Order - ₹${finalTotal.toFixed(2)}`
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

PaymentConfirmation.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        item: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
        quantity: PropTypes.number.isRequired,
        itemPrice: PropTypes.number.isRequired,
    })).isRequired,
    totalAmount: PropTypes.number.isRequired,
    tax: PropTypes.number.isRequired,
    platformFee: PropTypes.number.isRequired,
    appliedCoupon: PropTypes.shape({
        code: PropTypes.string.isRequired,
        discountAmount: PropTypes.number.isRequired,
    }),
    totalSavings: PropTypes.number.isRequired,
    isFreeDelivery: PropTypes.bool.isRequired,
    deliveryFee: PropTypes.number.isRequired,
    offerSavings: PropTypes.number.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    selectedPhoneNumber: PropTypes.string.isRequired,
    restaurantId: PropTypes.object.isRequired,
    cartId: PropTypes.string.isRequired,
};

export default PaymentConfirmation;