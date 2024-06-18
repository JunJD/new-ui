"use client"

import { AuthContext } from "@/provider/AuthProvider"
import { useContext, useState, useEffect, useRef, useCallback, ChangeEvent } from "react"
import * as Form from '@radix-ui/react-form';
import * as ScrollArea from '@radix-ui/react-scroll-area';

const incrementString = (str: string) => {
    let arr = str.split('').reverse();
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 'z') {
            arr[i] = 'a';
        } else {
            arr[i] = String.fromCharCode(arr[i].charCodeAt(0) + 1);
            return arr.reverse().join('');
        }
    }
    arr.push('a');
    return arr.reverse().join('');
};
let currentString = 'aaaa';
const TAGS = Array.from({ length: 50000 }).map((_, i, a) => {
    currentString = incrementString(currentString);
    return {
        value: `MA3NGRYGAB482422${currentString}2206270022`,
        flag: i % 2 === 0 ? "1" : "0", // 1有效 0无效
    }
});
const PAGE_SIZE = 100;  // 每次加载的标签数

export default function SearchFilterFrameNumber() {
    const { token } = useContext(AuthContext);
    const [loadedTags, setLoadedTags] = useState(TAGS.slice(0, PAGE_SIZE));
    const loadMoreRef = useRef(null);

    const [isGarbled, setIsGarbled] = useState('1');
    const [startComplement, setStartComplement] = useState('0000');
    const [startPosition, setStartPosition] = useState('1');
    const [carNumber, setCarNumber] = useState('');

    const handleStartPosition = (value: string) => {
        if (isNaN(+value)) return;
        setStartPosition(value);
        setCarNumber(prev => {
            // 清除空格
            const fixV = prev.replace(/\s/g, '');
            // 计算新的空格
            const newSpace = +value;

            // 在startPosition位置处补上空格
            const newCarNumber = fixV.slice(0, newSpace) + ' ' + fixV.slice(newSpace);

            // 返回新的车牌号
            return newCarNumber;
        })
    }
    const handleStartComplement = (value: string) => {


        setCarNumber(prev => {
            // 跳过第一个空格并在startComplement.length 位置处补上第二个空格
            const endIndex = prev.indexOf(' ');
            const ennValue = prev.slice(endIndex).replace(/\s/g, '');
            if (ennValue.length >= value.length || ennValue.length === 0) {
                setStartComplement(value);
            }
            let newEndValue = ennValue
            if (endIndex !== -1) {
                const newSpace = value.length
                newEndValue = ennValue.slice(0, newSpace) + ' ' + ennValue.slice(newSpace);
            }

            const newCarNumber = prev.slice(0, endIndex) + ' ' + newEndValue;

            // 返回新的车牌号
            return newCarNumber
        })
    }

    const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        console.log(event, value, 'event')
        console.log(value === '2');
        setIsGarbled(value);
        if (value === '2') {
            console.log('11111===11=1=1=')
            setStartComplement('aaaa');
        } else {
            console.log('1222222==1222222=')
            setStartComplement('0000');
        }
    };

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
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">车架号</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                请输入原始车架号
                            </Form.Message>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                required
                                placeholder="请输入原始车架号"
                                value={carNumber}
                                onChange={(e) => {
                                    setCarNumber(e.target.value)
                                    handleStartPosition(startPosition)
                                    handleStartComplement(startComplement)
                                }}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carBrand">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">车辆品牌筛选</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入车辆品牌,如果不填写则不筛选品牌"
                            />
                        </Form.Control>
                    </Form.Field>
                </div>
                <div className="flex flex-row gap-10 w-[100%]">
                    <Form.Field className="grid mb-[10px] w-[100%]" name="startPosition">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">截取开始位置</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入截取开始位置"
                                value={startPosition} onChange={(e) => handleStartPosition(e.target.value)}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="isGarbled" value={isGarbled} onChange={handleSelectChange}>
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">乱码还是顺码</Form.Label>
                        </div>
                        <Form.Control asChild >
                            <select
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"

                            >
                                <option value="1">顺码</option>
                                <option value="2">乱码</option>

                            </select>
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="startComplement">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">起始补充码</Form.Label>
                        </div>
                        <Form.Control asChild >
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入"
                                value={startComplement} onChange={(e) => handleStartComplement(e.target.value)}

                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="exhaustiveQuantity">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">穷举数量</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                type="number"
                                min={0}
                                max={300000}
                                placeholder="请输入"
                            />
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
                        <div className="text-violet11 text-[12px] leading-[18px] font-medium">过滤车架号</div>
                        {loadedTags.map((tag) => (
                            <div
                                className="text-mauve12 text-[13px] leading-[18px] mt-2.5 pt-2.5 border-t border-t-mauve6 flex flex-row"
                                key={tag.value}
                            >
                                <div>{tag.value}</div>
                                <div>---------------------------{tag.flag === "1" ? "已使用" : "未使用"}</div>
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
