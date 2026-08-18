import { memo, type ReactNode } from "react"

interface PageProps {
    children: ReactNode;
    title: ReactNode | string;
    extra?: ReactNode | string;
}

export const Page = memo(({ children, title, extra }: PageProps) => {
    return (
        <div className=" h-full flex flex-col justify-start bg-[#fbfbfb]">
            <div className=" h-12 px-4 flex items-center justify-between border-b border-[#e9e9e9]">
                <div>{title}</div>
                {extra && <div>{extra}</div>}
            </div>
            <div className=" flex-1 overflow-auto">{children}</div>
        </div>
    )
})