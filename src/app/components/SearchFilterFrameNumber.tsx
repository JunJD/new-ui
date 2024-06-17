"use client"

import { AuthContext } from "@/provider/AuthProvider"
import { useContext, useState, useEffect, useRef, useCallback } from "react"
import * as Form from '@radix-ui/react-form';
import * as ScrollArea from '@radix-ui/react-scroll-area';

const TAGS = Array.from({ length: 50000 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);
const PAGE_SIZE = 100;  // 每次加载的标签数

export default function SearchFilterFrameNumber() {
    const { token } = useContext(AuthContext);
    const [loadedTags, setLoadedTags] = useState(TAGS.slice(0, PAGE_SIZE));
    const loadMoreRef = useRef(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const carNumber = formData.get('carNumber');
        const carBrand = formData.get('carBrand');
        console.log(carNumber, 'carNumber', carBrand, 'carBrand')
    }

    const loadMoreTags = useCallback(() => {
        setLoadedTags(prevTags => {
            const nextTags = TAGS.slice(prevTags.length, prevTags.length + PAGE_SIZE);
            return [...prevTags, ...nextTags];
        });
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreTags();
            }
        }, { threshold: 1 });

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [loadMoreTags]);

    return (
        <div className="flex flex-col gap-[10px] w-[100%] h-[100%]">
            <Form.Root className="w-[100%] text-gray-800" onSubmit={handleSubmit}>
                <div className="flex flex-row gap-10 w-[100%]">
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carNumber">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[15px] font-medium leading-[35px] ">车架号</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                请输入原始车架号
                            </Form.Message>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                required
                                placeholder="请输入原始车架号"
                            />
                        </Form.Control>
                    </Form.Field>

                </div>

                <div className="flex flex-row gap-10 w-[100%]">
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carBrand">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[15px] font-medium leading-[35px] ">车辆品牌筛选</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入车辆品牌,如果不填写则不筛选品牌"
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carNumber">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[15px] font-medium leading-[35px] ">截取开始位置</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                type="number"
                                placeholder="请输入截取开始位置"
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carBrand">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[15px] font-medium leading-[35px] ">截取结束位置</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                type="number"
                                placeholder="请输入截取开始位置结束位置"
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="isGarbled">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[15px] font-medium leading-[35px] ">乱码还是顺码</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <select
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                defaultValue={"1"}
                            >
                                <option value="1">乱码</option>
                                <option value="2">顺码</option>

                            </select>
                        </Form.Control>
                    </Form.Field>
                </div>

                <Form.Submit asChild>
                    <button className="box-border w-full text-violet11 shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none mt-[10px]">
                        开始执行
                    </button>
                </Form.Submit>
            </Form.Root>
            <ScrollArea.Root className="w-[100%] flex flex-1 rounded overflow-hidden shadow-[0_2px_10px] shadow-blackA4 bg-white">
                <ScrollArea.Viewport className="w-full h-full rounded">
                    <div className="py-[15px] px-5">
                        <div className="text-violet11 text-[15px] leading-[18px] font-medium">Tags</div>
                        {loadedTags.map((tag) => (
                            <div
                                className="text-mauve12 text-[13px] leading-[18px] mt-2.5 pt-2.5 border-t border-t-mauve6"
                                key={tag}
                            >
                                {tag}
                            </div>
                        ))}
                        <div ref={loadMoreRef}></div>
                    </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                    className="flex select-none touch-none p-0.5 bg-blackA3 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                    orientation="vertical"
                >
                    <ScrollArea.Thumb className="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>
                <ScrollArea.Scrollbar
                    className="flex select-none touch-none p-0.5 bg-blackA3 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                    orientation="horizontal"
                >
                    <ScrollArea.Thumb className="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>
                <ScrollArea.Corner className="bg-blackA5" />
            </ScrollArea.Root>
        </div>
    )
}
