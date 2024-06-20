'use client'

import { AuthContext } from "@/provider/AuthProvider";
import { useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as CryptoJS from 'crypto'
const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams()

    const redirect = searchParams.get('redirect')

    const { setToken } = useContext(AuthContext);
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const usercode = formData.get('usercode');
        const password = formData.get('password');
        // 计算MD5哈希值
        const md5Hash = CryptoJS.createHash('md5').update(password as string).digest('hex');
        if (usercode && password) {
            const response = await fetch('/api/login', {
                method: "POST",
                body: JSON.stringify({ usercode, password: md5Hash }),
            })
            const result = await response.json()
            if (result.code === 0) {
                router.push((redirect || '/') + '?searchToken=' + result.data)
                setToken(result.data)
            }
        }
    }

    return (
        <section className="flex flex-col md:flex-row h-screen items-center">

            <div className="hidden md:block w-full md:w-1/2 h-screen bg-blue-600">
                {/* <Image src="bg.jpg" alt="" className="w-full h-full object-cover" /> */}
            </div>

            <div className="flex items-center justify-center w-full md:w-1/2 h-screen bg-white px-6 md:px-16 lg:px-12 text-gray-800">
                <div className="w-full max-w-md">
                    <form className="mt-6" onSubmit={handleLogin}>

                        <div>
                            <label className="block text-gray-700">账号</label>
                            <input name="usercode" placeholder="请输入账号" className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none" autoFocus required />
                        </div>

                        <div className="mt-4">
                            <label className="block text-gray-700">Password</label>
                            <input name="password" type="password" placeholder="请输入密码" minLength={6} className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none" required />
                        </div>

                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 focus:bg-blue-400 text-white font-semibold rounded-lg px-4 py-3 mt-6">Log In</button>
                    </form>
                </div>
            </div>

        </section>
    );
}

export default LoginPage
