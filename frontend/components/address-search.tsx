"use client"

import Script from "next/script"

type AddressSearchProps = {
  onComplete: (data: {
    zonecode: string
    roadAddress: string
  }) => void
}

export default function AddressSearch({
  onComplete,
}: AddressSearchProps) {
  function openPostcode() {
    new (window.daum as any).Postcode({
      oncomplete(data: any) {
        onComplete({
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
        })
      },
    }).open()
  }

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <button
        type="button"
        onClick={openPostcode}
        className="rounded-md border px-3 py-2 text-sm"
      >
        주소 검색
      </button>
    </>
  )
}