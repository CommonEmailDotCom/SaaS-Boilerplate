import { AppConfig } from '@/utils/AppConfig';

export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center text-xl font-semibold">
    <svg
      className="mr-1.5 size-8 stroke-current stroke-2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0 0h24v24H0z" stroke="none" />
      <path d="M3 20l1.3-3.9C1.976 14.663 2.1 11.065 4.222 8.55 6.346 6.035 9.89 4.865 13.37 5.315 16.851 5.765 19.794 7.773 21.043 10.62c1.249 2.848.665 6.139-1.478 8.43-2.144 2.29-5.5 3.27-8.758 2.54L3 20" />
    </svg>
    {!props.isTextHidden && AppConfig.name}
  </div>
);
