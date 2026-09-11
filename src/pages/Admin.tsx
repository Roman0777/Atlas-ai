import { SiteHeader } from "@/components/site-header";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Activity, CreditCard, LayoutList, Users } from "lucide-react";

function AdminContent() {
  const overview = useQuery(api.admin.getOverview);

  if (!overview) {
    return <main className="mx-auto max-w-5xl px-5 py-16 text-muted-foreground">Loading admin overview…</main>;
  }

  const stats = [
    { label: "Members", value: overview.userCount, icon: Users },
    { label: "Listings", value: overview.listingCount, icon: LayoutList },
    { label: "Active subscriptions", value: overview.activeSubscriptions, icon: CreditCard },
    { label: "Paid bids", value: overview.paidBids, icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-12">
        <p className="eyebrow">Operations</p>
        <h1 className="type-display mt-2">Admin overview</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <stat.icon className="size-5 text-accent" />
                <p className="mt-4 text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display mt-1 text-3xl font-black">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <CardContent className="p-5">
            <h2 className="font-display font-bold">Recent payment activity</h2>
            <div className="mt-4 divide-y divide-border/60">
              {overview.recentBids.map((bid) => (
                <div key={bid._id} className="flex items-center justify-between py-3 text-sm">
                  <span className="capitalize">{bid.kind} · {bid.status}</span>
                  <span className="font-mono">${(bid.amount / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <RequireAdmin>
      <AdminContent />
    </RequireAdmin>
  );
}
