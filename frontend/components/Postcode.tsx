// src/components/Postcode.tsx
"use client"; // Next.js App Router 환경에서는 필수입니다.

import React from 'react';
import { useDaumPostcodePopup } from 'react-daum-postcode';

interface PostcodeProps {
  onAddressSelect: (addressData: { zonecode: string; fullAddress: string }) => void;
}

const Postcode = ({ onAddressSelect }: PostcodeProps) => {
  // 다음 우편번호 스크립트 주소
  const scriptUrl = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  
  // 팝업을 열 수 있는 open 함수 가져오기
  const open = useDaumPostcodePopup(scriptUrl);

  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    // 도로명 주소(R)일 때 참고항목 조합
    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname;
      }
      if (data.buildingName !== '') {
        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    // 부모 컴포넌트로 우편번호(zonecode)와 최종 주소(fullAddress) 전달
    onAddressSelect({
      zonecode: data.zonecode,
      fullAddress: fullAddress,
    });
  };

  const handleClick = () => {
    // 버튼 클릭 시 팝업 오픈
    open({ onComplete: handleComplete });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        padding: "8px 16px",
        backgroundColor: "#0070f3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}
    >
      우편번호 검색
    </button>
  );
};

export default Postcode;