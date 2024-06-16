"use client"

import AuthGuards from "./guards/AuthGuards"

const HomePage = () => {
    return (
        <AuthGuards>
            <div>
                <h1>Hello, Next.js!</h1>
            </div>
        </AuthGuards>
    )
}
export default HomePage
