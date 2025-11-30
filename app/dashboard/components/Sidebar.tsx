"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiDollarSign, FiMap, FiLogOut, FiMenu } from "react-icons/fi";

export default function Sidebar({
  collapsed,
  onCloseDrawer,
}: {
  collapsed: boolean;
  onCloseDrawer?: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "House Price",
      href: "/dashboard/house-price",
      icon: <FiHome size={20} />,
    },
    {
      label: "House Rent",
      href: "/dashboard/house-rent",
      icon: <FiDollarSign size={20} />,
    },
    {
      label: "Land Price",
      href: "/dashboard/land-price",
      icon: <FiMap size={20} />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <div
      className={`h-full bg-black/20 backdrop-blur-xl border-r border-white/10 text-white p-4 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo / title */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <FiMenu size={22} className="md:hidden cursor-pointer" />
        {!collapsed && (
          <span className="text-xl font-semibold tracking-wide">
            AI Valuation
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseDrawer}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border 
              ${
                active
                  ? "bg-white/20 border-white/30"
                  : "border-transparent hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 mt-auto rounded-xl bg-white/10 hover:bg-white/20 transition"
      >
        <FiLogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
}
