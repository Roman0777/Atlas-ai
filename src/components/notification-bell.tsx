"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const count = useQuery(api.notifications.getUnreadCount);

  return (
    <Button variant="ghost" size="icon-sm" className="relative" title="Notifications">
      <Bell className="size-4" />
      <AnimatePresence>
        {count != null && count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
