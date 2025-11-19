import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: "success",
      title: "Verification Complete",
      message: "Your recent news check was verified as true",
      time: "5 minutes ago",
    },
    {
      id: 2,
      type: "warning",
      title: "Fake News Alert",
      message: "A story you checked was flagged as misinformation",
      time: "1 hour ago",
    },
    {
      id: 3,
      type: "info",
      title: "New Feature",
      message: "Check out our improved fact-checking algorithm",
      time: "2 hours ago",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-32 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
        </div>

        <div className="space-y-3 pb-6">
          {notifications.map((notification) => (
            <Card key={notification.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">{notification.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
