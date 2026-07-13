# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:20-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# Prisma 스키마 복사 및 클라이언트 생성
COPY prisma ./prisma/
RUN npx prisma generate

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 빌드 스테이지에서 생성된 Prisma 클라이언트를 dist 내부로 복사
COPY --from=builder /app/src/generated ./dist/generated

# 포트 노출
EXPOSE 3000

# 환경변수 설정 (선택사항)
ENV NODE_ENV=production

# 애플리케이션 시작
CMD ["npm", "start"]

