"use client"

import appStorage from "@/utils/appStorage";
import { createContext, useState } from "react"

export const AuthContext = createContext<
    {
        token: string,
        setToken: (token: string) => void
    }
>({
    token: "",
    setToken: () => {}
})

export default function AuthProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [token, setToken] = useState<string>(appStorage.getItem("token") || "")

    function _setToken (token: string) {
        appStorage.setItem("token", token)
        setToken(token)
    }
    
    return (
        <AuthContext.Provider value={{ token, setToken: _setToken }}>
            {children}
        </AuthContext.Provider>
    )
}