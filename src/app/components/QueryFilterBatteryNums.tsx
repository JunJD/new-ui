"use client"
import { toast } from 'react-hot-toast'
import { AuthContext } from "@/provider/AuthProvider"
import { useContext, useState, useEffect, useRef, useCallback, ChangeEvent } from "react"
import * as Form from '@radix-ui/react-form';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { delay, incrementAlphaNumericString, incrementAlphaString, incrementNumberString } from "@/utils/fetch";
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event';
const PAGE_SIZE = 100;  // 每次加载的标签数

interface listItem {
    value: string, // qydcbm
    status: string,
    battery_model?: string, //电池型号 dcxh
    battery_type?: string, // 电池类型 dclx
    bfn_or_oe?: string, // 电池品牌 // dcpp
    brand?: string //电池生产企业 dcscqy
    // dcrl 电池容量
}

export default function SearchFilterFrameNumber() {
    const { token } = useContext(AuthContext);
    const listRef = useRef<Array<listItem>>([]);
    const [loadedTags, setLoadedTags] = useState<Array<listItem>>([]);
    const loadMoreRef = useRef(null);
    const [isCancelled, setCancelled] = useState(false);
    const [isGarbled, setIsGarbled] = useState('1');
    const [startComplement, setStartComplement] = useState('0000');
    const [startPosition, setStartPosition] = useState("");
    const [carNumber, setCarNumber] = useState('');

    const _effectRef = useRef<any>(null);
    useEffect(() => {
        const _effect = async () => {
            if (_effectRef.current) {
                _effectRef.current();
            }

            _effectRef.current = await listen<listItem>('updateBatteryInfoList', (event) => {
                
                if (!event.payload) {
                    return;
                }
                if (event.payload.value === 'end') {
                    setCancelled(false)
                    return;
                }
                
                const { value, status, battery_model, battery_type, bfn_or_oe, brand } = event.payload;

                const payload = {
                    value,
                    status,
                    battery_model,
                    battery_type,
                    bfn_or_oe,
                    brand,
                };

                if(listRef.current.some(item => item.value === payload.value)) {
                    return;
                }
                // 使用新数据更新 listRef，确保没有重复数据
                listRef.current = [payload, ...listRef.current];

                // 在此处执行其他操作（例如加载更多标签、滚动到底部）
                loadMoreTags();
                scrollBottom();
            });
        }

        _effect();

        return () => {
            if (_effectRef.current) {
                _effectRef.current();
            }
        };
    }, []);

    const handleStartPosition = (value: string) => {
        const num = +value
        // 非数字

        setStartComplement('');
        setCarNumber(prev => {
            const fixV = prev.replace(/\s/g, '');
            // 计算新的空格
            const newSpace = num;
            if (newSpace <= fixV.length) {
                setStartPosition((num === 0 ? '' : num) + '');
                // 在startPosition位置处补上空格
                const newCarNumber = fixV.slice(0, newSpace) + ' ' + fixV.slice(newSpace);

                // 返回新的电池码
                return newCarNumber;
            } else {
                return prev
            }
        })
    }
    const handleStartComplement = (value: string, _isGarbled = isGarbled) => {
        console.log(value, 'value')
        if (_isGarbled === "1") {
            // 校验是否为纯数字
            const regex = /^\d+$/;
            if (!regex.test(value)) {
                toast.error('请输入纯数字');
                return;
            }
        }

        if (_isGarbled === "2") {
            // 校验是否为纯字母
            const regex = /^[a-zA-Z]+$/;
            if (!regex.test(value)) {
                toast.error('请输入纯字母');
                return;
            }
        }

        if (_isGarbled === "3") {
            // 校验是否为纯字母数字
            const regex = /^[a-zA-Z0-9]+$/;
            if (!regex.test(value)) {
                toast.error('请输入纯字母数字');
                return;
            }
        }

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

            // 返回新的电池码
            return newCarNumber
        })
    }
    const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {

        const value = event.target.value;
        setIsGarbled(value);
        setTimeout(() => {
            if (value === '2') {
                handleStartComplement('aaaa', value);
            } else if (value === "1") {
                handleStartComplement('0000', value);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(isCancelled) {
            cancelExecution()
            return
        }
        
        const form = e.currentTarget;
        const formData = new FormData(form);
        const carNumber = formData.get('carNumber') as string;
        const isGarbled = formData.get('isGarbled') as string;
        const startComplement = formData.get('startComplement') as string;
        const startPosition = formData.get('startPosition') as string;
        const exhaustiveQuantity = formData.get('exhaustiveQuantity') as string;

        if (!exhaustiveQuantity) {
            toast.error('请输入 exhaustiveQuantity');
            return
        }
        if (!carNumber) {
            toast.error('请输入 carNumber');
            return
        }
        if (!startPosition) {
            toast.error('请输入 startPosition');
            return
        }

        let currentString = startComplement;

        const list = Array.from({ length: Number(exhaustiveQuantity) }).fill(0).map((_, index) => {
            const leftV = carNumber?.slice(0, Number(startPosition) + 1).replace(/\s/g, '');
            const rightV = carNumber?.slice(Number(startPosition) + 1 + startComplement.length).replace(/\s/g, '');
            switch (isGarbled) {
                case "1":
                    currentString = incrementNumberString(currentString)
                    break;
                case "2":
                    currentString = incrementAlphaString(currentString)
                    break;
                default:
                    currentString = incrementAlphaNumericString(currentString);
                    break;
            }
            return `https://www.pzcode.cn/pwb/${leftV}${currentString}${rightV}`
        })
        setCancelled(true)
        await invoke('find_battery_nums_by_ids', {
            array: list,
            token
        });
    }

    const cancelExecution = async () => {
        setCancelled(false)
        await invoke('cancel_execution');
    }

    const loadMoreTags = useCallback(() => {
        setLoadedTags(prevTags => {
            const nextTags = listRef.current.slice(prevTags.length, prevTags.length + PAGE_SIZE);
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

    const viewportRef = useRef<HTMLDivElement>(null);

    function scrollBottom() {
        requestAnimationFrame(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current!.scrollHeight;
            }
        })
    }

    return (
        <div className="flex flex-col gap-[10px] w-[100%] h-[100%]">
            <Form.Root className="w-[100%] text-gray-800" onSubmit={handleSubmit}>
                <div className="flex flex-row gap-10 w-[100%]">
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carNumber">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">电池码</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                请输入原始电池码
                            </Form.Message>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                required
                                placeholder="请输入原始电池码"
                                value={carNumber}
                                onChange={(e) => {
                                    setCarNumber(e.target.value)
                                    handleStartPosition("")
                                    handleStartComplement('')
                                }}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="carBrand">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">电池品牌筛选</Form.Label>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入电池品牌,如果不填写则不筛选品牌"
                            />
                        </Form.Control>
                    </Form.Field>
                </div>
                <div className="flex flex-row gap-10 w-[100%]">
                    <Form.Field className="grid mb-[10px] w-[100%]" name="startPosition">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">截取开始位置</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                不能为空
                            </Form.Message>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入截取开始位置"
                                type='number'
                                required
                                value={startPosition} onChange={(e) => handleStartPosition(e.target.value)}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="isGarbled" >
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">乱码还是顺码</Form.Label>
                        </div>
                        <Form.Control asChild >
                            <select
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                value={isGarbled} onInput={handleSelectChange}
                            >
                                <option value="1">顺码</option>
                                <option value="2">乱码</option>
                                <option value="3">随机</option>

                            </select>
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="startComplement">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">起始补充码</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                不能为空
                            </Form.Message>
                        </div>
                        <Form.Control asChild >
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                placeholder="请输入"
                                required
                                value={startComplement} onChange={(e) => handleStartComplement(e.target.value)}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field className="grid mb-[10px] w-[100%]" name="exhaustiveQuantity">
                        <div className="flex items-baseline justify-between">
                            <Form.Label className="text-[12px] font-medium leading-[25px] ">穷举数量</Form.Label>
                            <Form.Message className="text-[13px]  opacity-[0.8]" match="valueMissing">
                                不能为空
                            </Form.Message>
                        </div>
                        <Form.Control asChild>
                            <input
                                className="box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[12px] leading-none  shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6"
                                type="number"
                                min={0}
                                max={300000}
                                defaultValue={30}
                                required
                                placeholder="请输入"
                            />
                        </Form.Control>
                    </Form.Field>
                </div>

                <Form.Submit asChild>
                    <button className="box-border w-full text-violet11 shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none mt-[10px]">
                        {isCancelled ? '暂停执行' : '开始执行'}
                    </button>
                </Form.Submit>
            </Form.Root>

            <ScrollArea.Root className="w-[100%] flex flex-1 rounded overflow-hidden shadow-[0_2px_10px] shadow-blackA4 bg-white">
                <ScrollArea.Viewport ref={viewportRef} className="w-full h-full rounded">
                    <div className="py-[15px] px-5">
                        <div className="text-violet11 text-[12px] leading-[18px] font-medium">
                            <div>过滤电池码</div>
                        </div>
                        {loadedTags.map((tag) => (
                            <div
                                className="text-mauve12 text-[13px] leading-[18px] mt-2.5 pt-2.5 border-t border-t-mauve6 flex flex-row"
                                key={tag.value}
                            >
                                <div>【电池码：{tag.value}】</div>
                                <div>---------------------------{tag.status === "success" ? "有效" : "无效"}</div>
                                {
                                    tag.status === "success" &&
                                    (
                                        <span>
                                            <span>【电池型号：{tag.battery_model}】</span>
                                            <span>【电池类型：{tag.battery_type}】</span>
                                            <span>【中文品牌：{tag.brand}】</span>
                                            <span>【电池品牌：{tag.bfn_or_oe}】</span>
                                        </span>
                                    )
                                }
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
