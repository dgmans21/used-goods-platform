"use client"

import { useState } from "react"
import { Coins, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import * as PortOne from "@portone/browser-sdk/v2"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

interface PointChargeModalProps {
  isOpen: boolean
  onClose: () => void
}
// 숫자를 '1만 5,000' 형태로 변환해 주는 함수
const formatKoreanMoney = (value: number | string): string => {
  const num = typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, ""), 10) : value;
  if (isNaN(num) || num === 0) return "";

  const unitWords = ["", "만", "억", "조"];
  const splitUnit = 10000;
  let result = [];
  let temp = num;
  let unitIndex = 0;

  while (temp > 0) {
    const mod = temp % splitUnit;
    if (mod > 0) {
      result.unshift(`${mod.toLocaleString()}${unitWords[unitIndex]}`);
    }
    temp = Math.floor(temp / splitUnit);
    unitIndex++;
  }

  return result.join(" ");
};
export function PointChargeModal({ isOpen, onClose }: PointChargeModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const chargePoints = useAuthStore((s) => s.chargePoints)
  const updatePoint = useAuthStore((s) => s.updatePoint)
  
  const [amount, setAmount] = useState<string>("")
  const [targetNickname, setTargetNickname] = useState<string>("") // 어드민 지급 대상 닉네임
  const [mode, setMode] = useState<"user" | "admin">("user") // 일반 결제 / 어드민 수동 지급 모드
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 어드민 여부 확인 (이메일/아이디 기준)
  const isAdmin = currentUser?.user_id?.toLowerCase() === "admin@admin.com"

  const handleAccumulateAmount = (val: number) => {
    const currentVal = parseInt(amount, 10)
    const baseAmount = isNaN(currentVal) ? 0 : currentVal
    setAmount((baseAmount + val).toString())
  }

  // 1. 일반 결제 충전 (KG이니시스 결제창 팝업호출)

const handleUserCharge = async () => {
  const chargeAmount = parseInt(amount, 10)
  if (isNaN(chargeAmount) || chargeAmount <= 0) {
    alert("올바른 금액을 입력해 주세요.")
    return
  }

  if (!currentUser?.id) {
    alert("로그인이 필요합니다.")
    return
  }

  setIsSubmitting(true)
  try {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 💡 타입스크립트 에러(빨간줄) 방지를 위해 (currentUser as any) 처리
    const userObj = currentUser as any
    const rawPhone = userObj.phone_number || userObj.phoneNumber || userObj.phone || "01000000000"
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, "") || "01000000000"

    // 🚀 KG이니시스 필수값 포함
    const response = await PortOne.requestPayment({
      storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
      channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
      paymentId: paymentId,
      orderName: `${chargeAmount.toLocaleString()} 포인트 충전`,
      totalAmount: chargeAmount,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
      customer: {
        email: currentUser.user_id || "user@example.com",
        fullName: currentUser.nickname || "포인트충전고객",
        phoneNumber: cleanPhone,
      },
      windowType: {
        pc: "IFRAME",
        mobile: "REDIRECTION",
      },
    })

    // 결제창을 그냥 닫거나 결제에 실패한 경우
    if (response?.code !== undefined) {
      toast.error(`결제 실패: ${response.message}`)
      return
    }

    // 결제 성공 시 서버 검증 및 포인트 적립
    await chargePoints(chargeAmount, response!.paymentId)
  
    toast.success(`${chargeAmount.toLocaleString()} 포인트가 성공적으로 충전되었습니다!`)
    setAmount("")
    onClose()
  } catch (error: any) {
    toast.error(error.message || "충전에 실패했습니다. 다시 시도해 주세요.")
  } finally {
    setIsSubmitting(false)
  }
}
  // 2. 👑 어드민 수동 포인트 지급
  const handleAdminGrant = async () => {
    const grantAmount = parseInt(amount, 10)
    if (isNaN(grantAmount) || grantAmount <= 0) {
      alert("올바른 포인트를 입력해 주세요.")
      return
    }

    if (!targetNickname.trim()) {
      alert("지급할 대상의 닉네임을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post(`${API_BASE}/api/applications/admin-grant`, {
        adminUserId: currentUser?.id,
        targetNickname: targetNickname.trim(),
        amount: grantAmount,
      })

      if (currentUser?.nickname === targetNickname.trim() && response.data?.newPoint !== undefined) {
        updatePoint(response.data.newPoint)
      }

      toast.success(`[어드민] '${targetNickname}'님에게 ${grantAmount.toLocaleString()}P가 지급되었습니다!`)
      setAmount("")
      setTargetNickname("")
      onClose()
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "어드민 포인트 지급 중 오류가 발생했습니다."
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "admin") {
      handleAdminGrant()
    } else {
      handleUserCharge()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-primary" />
              {mode === "admin" ? "관리자 전용 포인트 지급" : "포인트 충전하기"}
            </div>

            {isAdmin && (
              <Button
                type="button"
                variant={mode === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(mode === "user" ? "admin" : "user")}
                className="text-xs h-7 gap-1"
              >
                <ShieldCheck className="size-3.5 text-yellow-400" />
                {mode === "admin" ? "일반 결제 모드" : "어드민 지급 모드"}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "admin"
              ? "특정 닉네임 사용자의 포인트를 즉시 지급/수정합니다."
              : "충전하실 포인트 금액을 입력해 주세요."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {mode === "admin" && (
            <div className="flex flex-col gap-2 p-3 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <label htmlFor="targetNickname" className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                지급 대상 닉네임
              </label>
              <Input
                id="targetNickname"
                type="text"
                placeholder="예: 홍길동"
                value={targetNickname}
                onChange={(e) => setTargetNickname(e.target.value)}
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="text-sm font-medium">
                {mode === "admin" ? "지급할 포인트" : "충전 금액"}
              </label>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount("")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  금액 비우기
                </button>
              )}
            </div>
            
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="예: 10,000"
                value={
                  amount
                    ? Number(amount.toString().replace(/[^0-9]/g, "")).toLocaleString()
                    : ""
                }
                onChange={(e) => {
                  // 숫자 이외의 문자 제거 후 저장
                  const rawValue = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(rawValue);
                }}
                required
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                P
              </span>
            </div>

            {/* 💡 입력한 금액을 한글로 작게 보여주는 영역 추가 */}
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-muted-foreground text-right font-medium animate-in fade-in-50">
                {formatKoreanMoney(amount)} P ({Number(amount).toLocaleString()} P)
              </p>
            )}
          </div>


          <div className="grid grid-cols-4 gap-2">
            {[5000, 10000, 30000, 50000].map((val) => (
              <Button
                key={val}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAccumulateAmount(val)}
              >
                +{val.toLocaleString()}
              </Button>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              variant={mode === "admin" ? "destructive" : "default"}
            >
              {isSubmitting
                ? "처리 중..."
                : mode === "admin"
                ? "무료 포인트 지급하기"
                : "결제하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}