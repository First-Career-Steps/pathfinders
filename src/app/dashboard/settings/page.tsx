'use client';

import AccountDeletionPanel from '@/components/AccountDeletionPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();



    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-charcoal mb-2">Account Settings</h1>
                    <p className="text-gray-600">Manage your account preferences and security</p>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-bold text-charcoal mb-6">Account Information</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{user?.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">User ID</label>
                            <p className="text-gray-600 text-sm font-mono">{user?.id}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Account Created</label>
                            <p className="text-gray-900">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-bold text-charcoal mb-6">Actions</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">Change Password</h3>
                                <p className="text-sm text-gray-600">Update your account password</p>
                            </div>
                            <button
                                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-career-blue hover:text-career-blue transition-colors"
                                onClick={() => alert('Password change will be implemented in the next phase.')}
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">Sign Out</h3>
                                <p className="text-sm text-gray-600">Sign out of your account</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-bold text-charcoal">Your profile is private</h2>
                    <p className="mt-3 text-gray-600">Only your signed-in account can view your saved profile and download stored files. We do not publish a student directory or public resume links. Authorized staff and providers may process data to operate the service. You choose who receives a downloaded resume.</p>
                    <p className="mt-3 text-sm"><Link href="/privacy" className="text-career-blue underline">Privacy Policy</Link> · <Link href="/terms" className="text-career-blue underline">Terms of Service</Link></p>
                </section>
                <AccountDeletionPanel />

                {/* Back Link */}
                <div className="mt-8">
                    <Link
                        href="/dashboard"
                        className="text-career-blue hover:text-career-blue-dark font-medium"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
