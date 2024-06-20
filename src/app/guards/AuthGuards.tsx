import { useContext, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AuthContext } from '@/provider/AuthProvider';
import appStorage from '@/utils/appStorage';

const AuthGuard = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const { token, setToken } = useContext(AuthContext);
    const searchParams = useSearchParams()
    const searchToken = searchParams.get('searchToken')
    const router = useRouter();
    const pathname = usePathname()
    const redirectTo = pathname;
    useEffect(() => {
        verify().then((res)=>{
            if (!res) {
                router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
            }
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    async function verify () {
        const response = await fetch('/api/getBatteryInfo', {
            method: "POST",
            body: JSON.stringify({ token: token || searchToken, dcbhurl: "https%3A%2F%2Fwww.pzcode.cn%2Fpwb%2F7490121130102CHENHAICHI120122" }),
        })
        const result = await response.json()
        if (result.code === 2) {
            setToken('')
            return false
        } else {
            setToken(searchToken as string)
            return true
        }
    }
    if (!token) {
        return null; // 或者返回一个加载指示器
    }

    return children;
};

export default AuthGuard;
