"use client";
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CalendarDays, Calendar, Store, Edit3, Repeat2 } from "lucide-react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import WeeklySchedule from "@/components/WeeklySchedule";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import VendorTable from "@/components/VendorTable";
import MensalidadesView from "@/components/MensalidadesView";
import VendorEditor from "@/components/VendorEditor";
import LoginScreen from "@/components/LoginScreen";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { useVendorOverrides } from "@/hooks/useVendorOverrides";
import { useCustomFees } from "@/hooks/useCustomFees";

export default function Page() {
  const { isLoggedIn, checking, step, pendingEmail, login, verifyCode, cancelCodeStep, logout } = useAuth();
  const { overrides, customVendors, mergedVendors, updateVendor, resetVendor, addCustomVendor, deleteCustomVendor, updateCustomVendor } = useVendorOverrides();
  const { payments: basePayments, paidIds, togglePaid } = usePayments(mergedVendors);
  const { customFees, addFee, deleteFee } = useCustomFees();
  const payments = useMemo(() => [...basePayments, ...customFees], [basePayments, customFees]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const vendorMap = useMemo(
    () => Object.fromEntries(mergedVendors.map((v) => [v.id, v])),
    [mergedVendors]
  );

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        step={step}
        pendingEmail={pendingEmail}
        onLogin={login}
        onVerify={verifyCode}
        onBack={cancelCodeStep}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFrom={setDateFrom}
        onDateTo={setDateTo}
        onLogout={logout}
      />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-muted/60 p-1 w-full">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="semanal" className="gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="mensal" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="mensalidades" className="gap-1.5 text-xs sm:text-sm">
              <Repeat2 className="h-3.5 w-3.5" />
              Mensalidades
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="gap-1.5 text-xs sm:text-sm">
              <Store className="h-3.5 w-3.5" />
              Fornecedores
            </TabsTrigger>
            <TabsTrigger value="editar" className="gap-1.5 text-xs sm:text-sm">
              <Edit3 className="h-3.5 w-3.5" />
              Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              payments={payments}
              paidIds={paidIds}
              dateFrom={dateFrom}
              dateTo={dateTo}
              vendors={mergedVendors}
              vendorMap={vendorMap}
            />
          </TabsContent>
          <TabsContent value="semanal">
            <WeeklySchedule payments={payments} paidIds={paidIds} onToggle={togglePaid} />
          </TabsContent>
          <TabsContent value="mensal">
            <MonthlyCalendar payments={payments} paidIds={paidIds} onToggle={togglePaid} />
          </TabsContent>
          <TabsContent value="mensalidades">
            <MensalidadesView
              payments={payments}
              paidIds={paidIds}
              onToggle={togglePaid}
              vendors={mergedVendors}
              customFeeIds={customFees.map((f) => f.id)}
              onAddFee={addFee}
              onDeleteFee={deleteFee}
            />
          </TabsContent>
          <TabsContent value="fornecedores">
            <VendorTable payments={payments} paidIds={paidIds} onToggle={togglePaid} vendors={mergedVendors} />
          </TabsContent>
          <TabsContent value="editar">
            <VendorEditor
              vendors={mergedVendors}
              overrides={overrides}
              customVendorIds={customVendors.map((v) => v.id)}
              onUpdate={updateVendor}
              onReset={resetVendor}
              onAdd={addCustomVendor}
              onDelete={deleteCustomVendor}
              onUpdateCustom={updateCustomVendor}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
