import { twMerge } from 'tailwind-merge';
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';

export default (
  props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
) => (
  <a
    target="_blank"
    rel="noreferrer"
    {...props}
    className={twMerge(
      'text-white cursor-pointer no-underline border border-transparent text-center font-bold bg-[#264653] flex items-center justify-center h-10 px-5 rounded-3xl text-sm hover:text-[rgba(255,255,245,0.86)] hover:bg-[#1c343e]',
      props.className || ''
    )}
  >
    {props.children}
  </a>
);
