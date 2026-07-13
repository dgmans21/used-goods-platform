import Image from "next/image"
import Link from "next/link"

import type { Product } from "@/lib/types"
import { formatPoints } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent>
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <p className="mt-1 text-base font-bold text-primary">
            {formatPoints(product.price)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.sellerNickname} · {product.createdAt}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
