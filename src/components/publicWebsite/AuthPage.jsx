import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, signup } from '../../services/propertyApi';
import Logo from './Logo';

export default function AuthPage({ mode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isSignup = mode === 'signup';
    const [formState, setFormState] = useState({ status: 'idle', message: '' });

    async function handleSubmit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setFormState({ status: 'submitting', message: isSignup ? 'Creating your account...' : 'Signing you in...' });

        try {
            if (isSignup) {
                await signup({
                    firstName: form.get('first_name'),
                    lastName: form.get('last_name'),
                    email: form.get('email'),
                    password: form.get('password'),
                    confirmPassword: form.get('confirmPassword'),
                });
                setFormState({ status: 'success', message: 'Account created. Please log in to continue.' });
                return;
            }

            await login({ email: form.get('email'), password: form.get('password') });
            navigate(location.state?.from || '/');
        } catch (error) {
            setFormState({ status: 'error', message: error.message });
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-visual" aria-label="BoscoHam properties">
                <Link className="auth-brand" to="/"><Logo /></Link>
                <div className="auth-visual-copy">
                    <p className="auth-visual-kicker">A better way home</p>
                    <p className="auth-visual-quote">Make space for the life you are building.</p>
                    <p className="auth-visual-caption">Thoughtful properties, considered stays, and a team ready when you are.</p>
                </div>
                <p className="auth-visual-footer">Lagos · Abuja · Beyond</p>
            </section>
            <section className="auth-panel" aria-labelledby="auth-title">
                <div className="auth-panel-topline">
                    <p className="viewing-form-eyebrow">BoscoHam account</p>
                    <Link to="/">Back to home</Link>
                </div>
                <h1 id="auth-title">{isSignup ? 'Start your next chapter.' : 'Good to see you again.'}</h1>
                <p className="auth-intro">
                    {isSignup ? 'Create an account to request property viewings.' : 'Log in to request a property viewing.'}
                </p>
                <form className="viewing-form" onSubmit={handleSubmit}>
                    {isSignup && (
                        <>
                            <label htmlFor="auth-first-name">First name</label>
                            <input id="auth-first-name" name="first_name" type="text" required />
                            <label htmlFor="auth-last-name">Last name</label>
                            <input id="auth-last-name" name="last_name" type="text" required />
                        </>
                    )}
                    <label htmlFor="auth-email">Email address</label>
                    <input id="auth-email" name="email" type="email" required />
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" name="password" type="password" required />
                    {isSignup && (
                        <>
                            <label htmlFor="auth-confirm-password">Confirm password</label>
                            <input id="auth-confirm-password" name="confirmPassword" type="password" required />
                        </>
                    )}
                    {formState.status !== 'idle' && (
                        <p className={`form-status form-status-${formState.status}`} role={formState.status === 'error' ? 'alert' : 'status'}>
                            {formState.message}
                        </p>
                    )}
                    <button className="viewing-submit" type="submit" disabled={formState.status === 'submitting'}>
                        {formState.status === 'submitting' ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
                    </button>
                </form>
                <p className="auth-switch">
                    {isSignup ? 'Already have an account? ' : 'New to BoscoHam? '}
                    <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link>
                </p>
            </section>
        </main>
    );
}
