import { LogOut, ShieldCheck, Loader2, Users, ImageOff } from "lucide-react";
import { useLocation } from "wouter";
import { useCurrentUser, useLogout, useAdminUsers } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import type { PublicUserWithStatus } from "@shared/schema";

// PHASE 1 SCOPE: read-only user directory for admins.
// PHASE 2 TODO: prediction/usage stats per user will be added here once
// the field advisory feature (and its data) exists.

function SoilReportCell({ user }: { user: PublicUserWithStatus }) {
  const { t } = useLanguage();
  if (!user.soilReportImage) {
    return (
      <span className="text-muted-foreground text-sm inline-flex items-center gap-1">
        <ImageOff className="w-3.5 h-3.5" />
        {t("noReport")}
      </span>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          data-testid={`button-view-soil-report-${user.id}`}
        >
          {t("viewReport")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("soilTestReport")} — {user.fullname}
          </DialogTitle>
        </DialogHeader>
        <img
          src={user.soilReportImage}
          alt={`${user.fullname} soil report`}
          className="w-full max-h-[70vh] object-contain rounded-lg border bg-white"
        />
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const [, navigate] = useLocation();
  const { data: users, isLoading, isError, error } = useAdminUsers();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("adminPanelTitle")}
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="mr-1" />
            <span className="text-sm text-muted-foreground hidden md:inline">
              {t("hi")} <strong>{currentUser.fullname}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{t("logOut")}</span>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">{t("adminLabel")}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t("registeredUsers")}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t("registeredUsersSub")}
            </p>
          </div>
        </div>

        <div className="border rounded-2xl bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("loadingUsers")}
            </div>
          ) : isError ? (
            <div className="text-center py-16 px-6">
              <p className="text-destructive font-medium">{t("couldntLoadUsers")}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {error instanceof Error ? error.message : t("somethingWrong")}
              </p>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("noUsersYet")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fullNameCol")}</TableHead>
                  <TableHead>{t("usernameCol")}</TableHead>
                  <TableHead>{t("emailCol")}</TableHead>
                  <TableHead>{t("mobileCol")}</TableHead>
                  <TableHead>{t("roleCol")}</TableHead>
                  <TableHead>{t("statusCol")}</TableHead>
                  <TableHead>{t("soilReportCol")}</TableHead>
                  <TableHead>{t("joinedCol")}</TableHead>
                  <TableHead>{t("lastLoginCol")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.fullname}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.mobile}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge>{t("adminLabel")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("farmerBadge")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isOnline ? (
                        <Badge className="bg-green-600 hover:bg-green-600">
                          <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-white" />
                          {t("onlineBadge")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("offlineBadge")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <SoilReportCell user={user} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t("never")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
