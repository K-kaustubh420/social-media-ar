"use client";
import { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    getAdditionalUserInfo // Import this to check if user is new
} from 'firebase/auth';
import { auth } from '@/firebase/firebase'; // Assuming client config is exported here
import { createUserProfile } from '@/firebase/firebase'; // Adjust path if needed
import { FaGoogle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoArrowBack } from 'react-icons/io5';
import { FaSpinner } from 'react-icons/fa'; // For loading indicator


const Loginpage = (/*{ toggleAuthPopup }: LoginProps*/) => { // Remove prop if not needed
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [fullName, setFullName] = useState<string>(''); // For signup
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false); // Loading state
    const router = useRouter();

    const googleProvider = new GoogleAuthProvider();

    const signInWithGoogle = async () => {
        setError(null);
        setIsProcessing(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);

            // Check if it's a new user created via Google Sign-In
            if (additionalUserInfo?.isNewUser) {
                console.log("New user signed up with Google.");
                await createUserProfile(user); // Create profile if new
            } else {
                console.log("Existing user signed in with Google.");
                // Optional: Check if profile exists anyway, create if missing (edge case)
                await createUserProfile(user);
            }

            // toggleAuthPopup?.(); // Call if it's a prop and needed
            router.replace('/'); // Redirect to home page
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsProcessing(true);

        try {
            if (isLogin) {
                // --- LOGIN ---
                await signInWithEmailAndPassword(auth, email, password);
                console.log("User logged in successfully.");
                 // Optional: Check if profile exists, create if missing (for users created before profile logic)
                 if (auth.currentUser) {
                    await createUserProfile(auth.currentUser);
                }
            } else {
                // --- SIGNUP ---
                if (!fullName.trim()) {
                    throw new Error("Full Name is required for signup.");
                }
                const result = await createUserWithEmailAndPassword(auth, email, password);
                console.log("New user created successfully.");
                // Create profile immediately after successful signup
                await createUserProfile(result.user, fullName);
            }

            // toggleAuthPopup?.(); // Call if it's a prop and needed
            router.replace('/'); // Redirect to home page
        } catch (err: any) {
            console.error("Email/Password Auth Error:", err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to reset state when switching forms
    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError(null);
        setEmail('');
        setPassword('');
        setFullName('');
    }

    return (
        // --- JSX remains largely the same, but add disabled state to buttons ---
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 z-50">
            <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden w-full max-w-screen-lg m-4 flex md:flex-row flex-col"
            >
                {/* Left Side - Form */}
                <div className="p-6 md:p-12 md:w-1/2 flex flex-col justify-center relative"> {/* Added relative */}
                    <button onClick={() => router.back()} className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50" disabled={isProcessing}>
                        <IoArrowBack size={24} />
                    </button>

                    <div className="text-center mb-6 mt-8 md:mt-0"> {/* Added margin top for mobile */}
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'} {/* Adjusted Signup Title */}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isLogin ? 'Welcome back! Please enter your details.' : 'Join our community and start exploring.'}
                        </p>
                    </div>

                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            onClick={signInWithGoogle}
                            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                            disabled={isProcessing} // Disable during processing
                            aria-label="Sign in with Google"
                        >
                            <FaGoogle size={20} className="text-gray-800 dark:text-white" />
                        </button>
                         {/* Add other providers like Apple, etc. here */}
                    </div>

                    <div className="flex items-center my-2">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        <span className="px-3 text-sm text-gray-400 dark:text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>

                    {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>} {/* Centered error */}

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.form
                            key={isLogin ? 'loginForm' : 'signupForm'}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {!isLogin && ( // Full Name only for signup
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-800 dark:text-white mb-1">Full Name</label> {/* Added margin */}
                                    <input
                                        type="text"
                                        id="fullName"
                                        className="input input-bordered w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white" // Use DaisyUI input class
                                        placeholder="Your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={isProcessing} // Disable during processing
                                    />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-white mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="input input-bordered w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isProcessing}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-800 dark:text-white mb-1">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="input input-bordered w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isProcessing}
                                />
                            </div>
                            {/* Remember me / Forgot Password - Kept as is */}
                            <div className="flex justify-between items-center text-sm">
                                {/* ... */}
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full rounded-lg text-lg font-medium disabled:opacity-70" // Use DaisyUI button
                                disabled={isProcessing} // Disable during processing
                            >
                                {isProcessing ? (
                                    <FaSpinner className="animate-spin mr-2" /> // Show spinner
                                ) : (
                                    isLogin ? 'Sign in' : 'Sign up'
                                )}
                            </button>
                        </motion.form>
                    </AnimatePresence>

                    <div className="text-center text-sm mt-6 text-gray-600 dark:text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={toggleForm} disabled={isProcessing} className="text-blue-600 hover:underline cursor-pointer dark:text-blue-500 font-medium disabled:opacity-50">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>
                </div>

                {/* Right Side - Image */}
                <div className="md:w-1/2 relative hidden md:block">
                    <Image
                        src="/Explore.jpeg" // Make sure this image exists in your public folder
                        alt="Content Exploration"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-r-2xl" // Adjust rounding if needed
                        priority // Load image faster
                    />
                     {/* Optional Overlay */}
                     <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-transparent to-transparent"></div>
                </div>
            </motion.div>
        </div>
    );
};

export default Loginpage;