import { useState } from 'react'
import api from '../api/axios'

export default function PaymentModal({ course, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')

    try {
      // 1) Check Razorpay script
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded')
      }

      // 2) Create order from backend
      const res = await api.post('/payments/create-order', {
        course_id: course.id
      })

      console.log('CREATE ORDER RESPONSE:', res.data)

      const {
        order_id,
        id,
        amount,
        currency,
        key_id,
        course_title,
        user_name,
        user_email
      } = res.data

      // Some backends return "id" instead of "order_id"
      const razorpayOrderId = order_id || id

      if (!razorpayOrderId) {
        throw new Error('Order ID missing from backend response')
      }

      if (!key_id) {
        throw new Error('Razorpay key_id missing from backend response')
      }

      if (!amount || !currency) {
        throw new Error('Amount or currency missing from backend response')
      }

      const options = {
        key: key_id,
        amount: Number(amount),
        currency,
        name: 'Learnly',
        description: course_title || course.title,
        order_id: razorpayOrderId,
        prefill: {
          name: user_name || '',
          email: user_email || ''
        },
        theme: { color: '#7c3aed' },
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              course_id: course.id
            })

            setLoading(false)
            onSuccess()
          } catch (verifyError) {
            console.error('VERIFY ERROR:', verifyError)
            setError(
              verifyError.response?.data?.detail ||
              verifyError.message ||
              'Payment verification failed. Contact support.'
            )
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', function (response) {
        console.error('PAYMENT FAILED:', response.error)
        setError(response.error?.description || 'Payment failed')
        setLoading(false)
      })

      rzp.open()
    } catch (e) {
      console.error('PAYMENT INIT ERROR:', e)
      setError(
        e.response?.data?.detail ||
        e.message ||
        'Failed to initiate payment'
      )
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="animate-fade-up w-full max-w-md glass rounded-2xl p-8 relative"
        style={{ background: '#0f1117', border: '1px solid rgba(124,58,237,0.3)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xl"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center text-2xl mx-auto mb-4">
            🎓
          </div>
          <div className="font-display text-xl text-white mb-1">{course.title}</div>
          <div className="text-gray-400 text-sm">by {course.instructor}</div>
        </div>

        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Course price</span>
            <span className="text-white font-semibold">₹{course.price}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">GST (18%)</span>
            <span className="text-gray-300 text-sm">₹{(course.price * 0.18).toFixed(2)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
            <span className="text-white font-medium">Total</span>
            <span className="text-violet-400 font-bold text-lg">
              ₹{(course.price * 1.18).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-4 text-xs text-gray-500 justify-center">
          <span>🔒 Secure payment via</span>
          <span className="text-blue-400 font-medium">Razorpay</span>
        </div>

        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {['UPI', 'Cards', 'NetBanking', 'Wallets'].map((m) => (
            <span
              key={m}
              className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10"
            >
              {m}
            </span>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full btn-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Processing...
            </span>
          ) : `Pay ₹${(course.price * 1.18).toFixed(2)}`}
        </button>

        <p className="text-center text-xs text-gray-600 mt-3">
          By paying you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}