"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent ,   // avoid name clash if needed
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { format } from "date-fns";
import { CalendarIcon, Copy, Download, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "../../../lib/api";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";
import { Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface GeneratedPin {
  pinId?: number;           // optional, may not be returned
  pinCode: string;
//   pinCode: string;           // full original PIN (kept private)
  displayPin?: string;
  sessionName: string;
  termName: string;
  status: "Unused" | "Activated" | "Expired" | "Locked";
  activatedBy?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export default function AdminGenerateResultPins() {
  const [quantity, setQuantity] = useState<number>(10);
  const [autoActivate, setAutoActivate] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);

  const [pins, setPins] = useState<GeneratedPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // From /wallet-balance
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<{
    academicYearId: number;
    academicYearName: string;
  } | null>(null);

  const [currentTerm, setCurrentTerm] = useState<{
    termId: number;
    termName: string;
  } | null>(null);

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

const [costPerPin, setCostPerPin] = useState<number>(0);     // or null if you want loading state
const [fetchingPrice, setFetchingPrice] = useState(false);
const [totalAmount, setTotalAmount] = useState<number>(0);

const displayCostPerPin = fetchingPrice ? "…" : costPerPin;
const displayTotalAmount  = fetchingPrice ? "…" : totalAmount;

  // Filters
  const [filterTerm, setFilterTerm] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchPin, setSearchPin] = useState<string>("");

  useEffect(() => {
    fetchWalletAndDefaults();
    fetchPins();
  }, []);

  const fetchWalletAndDefaults = async () => {
    try {
      const res = await api.get("/wallet-balance");
      const data = res.data;

      setWalletBalance(parseFloat(data.walletBalance) || 0);

      if (data.academicYear) {
        setCurrentAcademicYear(data.academicYear);
      }

      if (data.term) {
        setCurrentTerm(data.term);
      }
    } catch (err: any) {
      console.error("Failed to load wallet/session/term:", err);
      toast.error("Could not load wallet balance and current session/term");
    }
  };

const fetchPins = async () => {
  setLoading(true);
  try {
    const res = await api.get("/pins");           // ← your real endpoint
    // Extract the actual array
    const pinArray = res.data?.pins || [];
    
    // Map to your GeneratedPin shape (adapt fields as needed)
    const formattedPins: GeneratedPin[] = pinArray.map((raw: any) => ({
      // You don't have full pinCode — only last 4 digits
      pinLast4: raw.pinLast4 || "????",
      // pinCode: ??? → if you never get full code, maybe remove or fake it
      // For display we'll use masked version anyway
      sessionName: res.data?.academicYear || "—",
      termName: res.data?.term || "—",
      status: raw.isActive === 1 ? "Unused" : "Expired", // ← guess / map properly
      activatedBy: null,                // you don't have this yet
      createdAt: raw.expiresAt || new Date().toISOString(), // placeholder
      expiresAt: raw.expiresAt || null,
      // optional: keep original raw data if useful
      // rawData: raw,
    }));

    setPins(formattedPins);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load existing PINs");
    setPins([]); // safety
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  if (quantity < 1) {
    setCostPerPin(0);
    return;
  }

  const fetchPrice = async () => {
    setFetchingPrice(true);
    try {
      const res = await api.post("/pins/calculate-price", { quantity });   // ← new endpoint suggestion
      // or GET /pins/price?quantity=${quantity}

      const data = res.data;

      // Adjust according to your actual response shape
      setCostPerPin(data.costPerPin || 0);
      // Optional: you can also get totalCost from backend if you want
      setTotalAmount(data.totalAmount || quantity * (data.costPerPin || 0));
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch current PIN pricing");
      setCostPerPin(0); // or keep previous value
    } finally {
      setFetchingPrice(false);
    }
  };

  fetchPrice();

  // Optional: add 400–800 ms debounce here if you want to reduce requests
}, [quantity]);

  const handleGenerateClick = () => {
    const totalCost = quantity * costPerPin;
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (walletBalance !== null && totalCost > walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAndGenerate = async () => {
    setConfirmOpen(false);
    setGenerating(true);

    try {
      const payload = {
        academicYearId: currentAcademicYear?.academicYearId,
        termId: currentTerm?.termId,
        quantity,
        autoActivate,
        expiryDate: expiryDate ? expiryDate.toISOString() : null,
      };

      const res = await api.post("/pins/generate", payload);
      const responseData = res.data;

      toast.success(responseData.message || "PINs generated successfully");

      // Add newly generated PINs to the list (with defaults)
      const newPins: GeneratedPin[] = responseData.pins.map((code: string) => ({
        pinCode: code,
        sessionName: responseData.academicYear || currentAcademicYear?.academicYearName || "—",
        termName: responseData.term || currentTerm?.termName || "—",
        status: "Unused",
        activatedBy: null,
        createdAt: new Date().toISOString(),
        expiresAt: expiryDate ? expiryDate.toISOString() : null,
      }));

      setPins((prev) => [...newPins, ...prev]);

      // Update wallet balance
      if (walletBalance !== null) {
        setWalletBalance(walletBalance - quantity * costPerPin);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate PINs");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("PIN copied to clipboard");
  };

  // In filtering (line ~196)
const filteredPins = pins.filter((pin) => {
  const matchesTerm   = filterTerm === "all" || pin.termName === filterTerm;
  const matchesStatus = filterStatus === "all" || pin.status === filterStatus;
  const matchesSearch = searchPin === "" || pin.pinLast4?.includes(searchPin.toUpperCase());
  return matchesTerm && matchesStatus && matchesSearch;
});

  const totalCost = quantity * costPerPin;
const canGenerate =
  quantity >= 1 &&
  currentAcademicYear?.academicYearId &&
  currentTerm?.termId &&
  costPerPin > 0 &&                           // ← important
  !fetchingPrice &&                           // optional
  (walletBalance === null || totalAmount <= walletBalance);
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Result Access PINs
            </h1>
          </div>
        </div>

        {/* Generation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Result PINs</CardTitle>
            <CardDescription>
              Create secure one-time PINs for parents to access student results.
            </CardDescription>
            {/* // Inside the CardHeader div, after the existing filters: */}

          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg">
              <div>
                <Label className="text-xs">Academic Session</Label>
                <p className="font-medium text-lg font-semibold">
                  {currentAcademicYear?.academicYearName || "Loading..."}
                </p>
              </div>
              <div>
                <Label className="text-xs">Current Term</Label>
                <p className="font-medium text-lg font-semibold">
                  {currentTerm?.termName || "Loading..."}
                </p>
              </div>
             
              <div>
                <Label className="text-xs">Wallet Balance</Label>
                <p className="text-xl font-bold text-green-700">
                  {walletBalance !== null
                    ? `₦${Number(walletBalance).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "Loading..."}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>



           <div className="flex flex-col justify-end">
  <p className="text-sm text-muted-foreground">Cost per PIN</p>
  
  {fetchingPrice ? (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <p className="text-3xl font-bold text-muted-foreground">Calculating...</p>
    </div>
  ) : (
    <>
      <p className="text-3xl font-bold">
        ₦{Number(costPerPin).toLocaleString("en-NG")}
      </p>
      
      <p className="text-lg mt-1 font-medium">
        Total Cost:{" "}
        <span
          className={
            totalCost > (walletBalance || 0)
              ? "text-destructive"
              : "text-green-700"
          }
        >
          ₦{Number(totalCost).toLocaleString("en-NG")}
        </span>
      </p>
    </>
  )}
</div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t">
              <div className="flex-1">
                {walletBalance !== null && totalCost > walletBalance && (
                  <p className="text-sm text-destructive font-medium">
                    Insufficient wallet balance (₦
                    {Number(walletBalance).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ). Please top up.
                  </p>
                )}
              </div>

              <Button
                size="lg"
                disabled={!canGenerate || generating}
                onClick={handleGenerateClick}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90 min-w-[200px] h-12 text-base"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate PINs Now"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm PIN Generation</DialogTitle>
              <DialogDescription>
                You are about to generate <strong>{quantity}</strong> PINs.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Session</p>
                  <p className="font-medium">{currentAcademicYear?.academicYearName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">{currentTerm?.termName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost per PIN</p>
                  <p className="font-medium">₦{costPerPin.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-lg font-bold text-center">
                  Total Cost: ₦{totalCost.toLocaleString()}
                </p>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  This amount will be deducted from your wallet balance.
                </p>
              </div>

              {walletBalance !== null && totalCost > walletBalance && (
                <p className="text-destructive text-center font-medium">
                  Insufficient balance — top up your wallet first.
                </p>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAndGenerate}
                disabled={generating || (walletBalance !== null && totalCost > walletBalance)}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
              >
                {generating ? "Processing..." : "Confirm & Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generated PINs Table */}
        <Card>
     
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Generated PINs ({filteredPins.length})</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PIN..."
                  className="pl-9 w-48"
                  value={searchPin}
                  onChange={(e) => setSearchPin(e.target.value)}
                />
              </div>

              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="First Term">First Term</SelectItem>
                  <SelectItem value="Second Term">Second Term</SelectItem>
                  <SelectItem value="Third Term">Third Term</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Unused">Unused</SelectItem>
                  <SelectItem value="Activated">Activated</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={fetchPins}>
                <RefreshCw className="h-4 w-4" />
              </Button>

<Button
  variant="outline"
  onClick={() => {
    if (filteredPins.length === 0) {
      toast.info("No PINs to copy");
      return;
    }
    const text = filteredPins.map(p => p.pinCode).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied ${filteredPins.length} PIN${filteredPins.length === 1 ? "" : "s"}`);
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  }}
  disabled={filteredPins.length === 0 || loading}
  className={
    filteredPins.length > 0 && !loading
      ? "border-green-500 text-white bg-[#1F6F43] hover:bg-[#1F6F43]/90 hover:text-white"
      : ""
  }
>
  <Copy className="h-4 w-4 mr-2" />
  Copy All PINs
</Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredPins.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No PINs found matching your filters.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PIN Code</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Activated By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPins.map((pin, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-medium">
                          {pin.pinCode} {pin.pinLast4 ? `****${pin.pinLast4}` : ""}
                        </TableCell>
                        <TableCell>{pin.sessionName}</TableCell>
                        <TableCell>{pin.termName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pin.status === "Unused" ? "secondary" :
                              pin.status === "Activated" ? "default" :
                              pin.status === "Expired" ? "destructive" :
                              "outline"
                            }
                          >
                            {pin.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{pin.activatedBy || "—"}</TableCell>
                        <TableCell>
                          {format(new Date(pin.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pin.pinCode)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}