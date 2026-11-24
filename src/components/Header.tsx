'use client';

import Link from "next/link";
import Image from "next/image";
import { products } from "@/lib/education/chrome";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Header() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="fcs-top">
            <div className="fcs-top-inner">
                <Link className="fcs-logo" href="/">
                    <Image src="/logo.svg" alt="First Career Steps home" width={120} height={52} />
                </Link>
                <nav className="fcs-products" aria-label="Products">
                    {products.map(({href,title}) => <Link key={href} href={href}>{title}</Link>)}
                </nav>
                <div className="fcs-account-area">
                    {loading ? <span className="fcs-account-loading" aria-label="Loading account" /> : user ? <>
                        <Link href="/dashboard">Dashboard</Link>
                        <button className="fcs-account" disabled={isLoggingOut} onClick={handleLogout}>
                            {isLoggingOut ? 'Signing out…' : 'Sign out'}
                        </button>
                    </> : <>
                        <Link href="/login">Sign in</Link>
                        <Link className="fcs-account" href="/signup">Get started</Link>
                    </>}
                </div>
            </div>
        </header>
    );
}
