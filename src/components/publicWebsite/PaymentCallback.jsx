import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../../services/propertyApi';
import './payment-callback.css';

const WHATSAPP_NUMBER = '2347049109862';

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const paymentStatus = (searchParams.get('status') || '').toLowerCase();
    const isUnsuccessful = ['cancelled', 'failed', 'abandoned'].includes(paymentStatus)
        || searchParams.get('cancelled') === 'true';
    const [verification, setVerification] = useState({ status: reference ? 'verifying' : 'idle', message: '' });

    useEffect(() => {
        if (!reference) return undefined;

        let isCurrent = true;
        verifyPayment(reference)
            .then((response) => {
                if (!isCurrent) return;
                const status = response.data?.payment_status;
                setVerification({
                    status: status === 'successful' ? 'successful' : status || 'pending',
                    message: '',
                });
            })
            .catch((error) => {
                if (!isCurrent) return;
                setVerification({
                    status: error.status === 401 ? 'unauthenticated' : 'error',
                    message: error.message,
                });
            });

        return () => { isCurrent = false; };
    }, [reference]);

    const supportMessage = reference
        ? `Hi Boscoham, please help confirm my Paystack payment. Reference: ${reference}`
        : 'Hi Boscoham, I need help with a Paystack payment.';
    const supportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(supportMessage)}`;

    let title = 'Confirming your payment';
    let message = 'We are checking your payment with Paystack. This can take a few moments.';

    if (verification.status === 'successful') {
        title = 'Payment confirmed';
        message = 'Your payment was verified successfully. Your shortlet booking is now with the Boscoham team.';
    } else if (['failed', 'refunded'].includes(verification.status) || (isUnsuccessful && verification.status === 'pending')) {
        title = 'Payment was not completed';
        message = 'Paystack did not confirm a successful payment. You can return to Boscoham or contact our team for help.';
    } else if (verification.status === 'pending') {
        title = 'Payment confirmation is pending';
        message = 'Paystack has not confirmed this payment yet. Keep this reference and contact our team if the status does not update.';
    } else if (verification.status === 'unauthenticated') {
        title = 'Sign in to confirm your payment';
        message = 'Your payment reference is ready, but your session has expired. Sign in and return here to verify the payment.';
    } else if (verification.status === 'error') {
        title = 'We could not verify your payment';
        message = verification.message || 'The payment could not be verified right now. Keep this reference and contact our team.';
    } else if (isUnsuccessful && !reference) {
        title = 'Payment was not completed';
        message = 'The payment did not complete. You can return to Boscoham and try again when you are ready.';
    } else if (!reference) {
        title = 'We could not find your payment reference';
        message = 'No Paystack reference was included in this return. Contact our team and we will help you check the payment.';
    }

    return (
        <main className="payment-callback-page">
            <section className="payment-callback-content" aria-labelledby="payment-callback-title">
                <Link className="payment-callback-brand" to="/" aria-label="Boscoham home">
                    <img src="/Boscoham%20Logo.jpeg" alt="" />
                    <span>boscoham</span>
                </Link>

                <div className={`payment-callback-mark${['failed', 'refunded'].includes(verification.status) || isUnsuccessful ? ' is-cancelled' : ''}`} aria-hidden="true">
                    <span>{verification.status === 'successful' ? '✓' : ['failed', 'refunded'].includes(verification.status) || isUnsuccessful ? '!' : 'B'}</span>
                </div>

                <p className="payment-callback-eyebrow">PAYSTACK CHECKOUT</p>
                <h1 id="payment-callback-title">{title}</h1>
                <p className="payment-callback-message">{message}</p>

                {reference && (
                    <dl className="payment-callback-reference">
                        <dt>Payment reference</dt>
                        <dd>{reference}</dd>
                    </dl>
                )}

                <div className="payment-callback-actions">
                    {verification.status === 'unauthenticated' ? (
                        <Link className="payment-callback-primary" to="/login" state={{ from: `${location.pathname}${location.search}` }}>
                            Sign in to verify
                        </Link>
                    ) : (
                        <a className="payment-callback-primary" href={supportUrl} target="_blank" rel="noreferrer">
                            Contact Boscoham
                        </a>
                    )}
                    <Link className="payment-callback-secondary" to="/">
                        Return to home
                    </Link>
                </div>

                <p className="payment-callback-note">
                    {verification.status === 'verifying' ? 'Checking payment status securely with Paystack.' : 'Payment status is based on server-side verification with Paystack.'}
                </p>
            </section>
        </main>
    );
}