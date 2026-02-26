"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faCirclePlus,
  faReceipt,
  faTags,
  faComments,
  faBuilding,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

export default function QuickActions() {
  const actions = [
    { href: "/dashboard/tenants/create", label: "Create Business", icon: faBuilding },
    { href: "/dashboard/invoices/create", label: "Create Invoice", icon: faCirclePlus },
    { href: "/dashboard/invoices", label: "Billing", icon: faReceipt },
    { href: "/dashboard/plans", label: "Pricing", icon: faTags },
    { href: "/dashboard/support", label: "Support", icon: faComments },
    { href: "/dashboard/profile", label: "Profile", icon: faUser },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="flex flex-col items-center justify-center gap-2 group transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 border border-white/30">
              <FontAwesomeIcon icon={action.icon} className="text-base" />
            </div>
            <span className="text-xs font-medium text-center leading-tight text-white group-hover:text-blue-50 transition-colors">
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}