import { useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation'
import { AuthContext } from '@/provider/AuthProvider';

const AuthGuard = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const { token } = useContext(AuthContext);
    const router = useRouter();
    const pathname = usePathname()
    const redirectTo = pathname;
    useEffect(() => {

        if (!token) {
            console.log("redirectTo==>", redirectTo)
            router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        }
    }, [token, router, redirectTo]);

    if (!token) {
        return null; // 或者返回一个加载指示器
    }

    return children;
};

export default AuthGuard;
