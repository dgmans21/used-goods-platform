export interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    
    // 💡 이미지 키 멀티 지원 (메인 페이지에서 넘겨주는 image도 추가)
    image_url?: string;
    imageUrl?: string; 
    image?: string; // 👈 추가
    
    status?: string; // 'sale' | 'reserved' | 'sold_out' 등
    
    // 💡 판매자 정보 및 닉네임 지원
    seller_id: number;
    sellerId?: number; 
    sellerNickname?: string; // 👈 추가 (메인에서 넘겨주는 닉네임)
  
    // 💡 날짜 포맷터가 가공한 문자열을 담기 위해 string 타입 허용
    created_at?: string;
    updated_at?: string;
    createdAt?: string; // 👈 추가 (메인에서 포맷팅 후 넘겨주는 camelCase 날짜)
  }