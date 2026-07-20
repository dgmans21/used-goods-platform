"use client"

import { useState } from "react"
import { Coins } from "lucide-react"
import { toast } from "sonner"

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
import { useAuthStore } from "@/store/authStore" // 🚀 유저 정보 및 포인트 충전 액션 통합 사용

interface PointChargeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PointChargeModal({ isOpen, onClose }: PointChargeModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  
  // 🚀 통합된 authStore에서 포인트 충전 액션을 직접 가져옵니다.
  const chargePoints = useAuthStore((s) => s.chargePoints)
  
  const [amount, setAmount] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🚀 버튼 클릭 시 기존 입력 금액에 계속 누적해서 더해주는 함수
  const handleAccumulateAmount = (val: number) => {
    const currentVal = parseInt(amount, 10)
    const baseAmount = isNaN(currentVal) ? 0 : currentVal
    setAmount((baseAmount + val).toString())
  }

  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      // 🚀 단일화된 chargePoints 함수를 실행합니다.
      await chargePoints(chargeAmount)
    
      // 1. 성공 토스트 띄우기 (사용자 클릭을 기다리지 않고 바로 아래 코드가 실행됨)
      toast.success(`${chargeAmount.toLocaleString()} 포인트가 성공적으로 충전되었습니다!`)
      
      // 2. 입력값 초기화 및 모달 닫기 (즉시 실행되어 자연스럽게 닫힘)
      setAmount("")
      onClose()
    } catch (error: any) {
      // 에러 발생 시에도 토스트로 친절하게 전달
      toast.error(error.message || "충전에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            포인트 충전하기
          </DialogTitle>
          <DialogDescription>
            충전하실 포인트 금액을 입력해 주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCharge} className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="text-sm font-medium">
                충전 금액
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
                type="number"
                placeholder="예: 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="1000"
                required
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                P
              </span>
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "충전 중..." : "충전하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}