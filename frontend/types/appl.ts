export interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    
    // 💡 백엔드(snake_case)와 프론트엔드(camelCase) 이미지 키를 모두 지원하도록 가드 추가
    image_url?: string;
    imageUrl?: string; 
    
    status?: string; // 'sale' | 'reserved' | 'sold' 등
    
    // 💡 판매자 ID 역시 둘 다 지원하여 카드 컴포넌트 오류 방지
    seller_id: number;
    sellerId?: number; 
  
    created_at?: string;
    updated_at?: string;
  }