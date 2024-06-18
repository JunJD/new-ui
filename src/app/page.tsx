"use client"

import AuthGuards from "./guards/AuthGuards"
import React, { useContext, useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { AuthContext } from "@/provider/AuthProvider";
import SearchFilterFrameNumber from "./components/SearchFilterFrameNumber";

const HomePage = () => {
    const [mounted, setMounted] = useState(false);
    const { token } = useContext(AuthContext)
    useEffect(() => {
        setMounted(true);
    }, [])
    return (
        mounted && <AuthGuards>
            <Tabs.Root
                className="flex flex-col w-[100%] h-[100vh] border-none"
                defaultValue="tab1"
            >
                <Tabs.List className="shrink-0 flex border-b border-mauve6" aria-label="Manage your account">
                    <Tabs.Trigger
                        className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                        value="tab1"
                    >
                        查询及过滤车架号
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                        value="tab2"
                    >
                        查询及过滤电池号
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                        value="tab3"
                    >
                        绑定测试电池有效性
                    </Tabs.Trigger>

                </Tabs.List>
                <Tabs.Content
                    className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black overflow-y-hidden"
                    value="tab1"
                >
                    <SearchFilterFrameNumber />
                </Tabs.Content>
                <Tabs.Content
                    className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
                    value="tab2"
                >
                    <p className="mb-5 text-mauve11 text-[15px] leading-normal">
                        开发中...
                    </p>
                </Tabs.Content>
            </Tabs.Root>
        </AuthGuards>
    )
}


export default HomePage
