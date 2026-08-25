import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class OrdersRepository {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    return this.db.order.findUnique({
      where: { id },
      include: { orderItems: { include: { item: { include: { submission: true } } } } },
    });
  }

  /** Paid orders awaiting dispatch that contain any of this seller's items. */
  async findForSeller(sellerId: string) {
    return this.db.order.findMany({
      where: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        orderItems: { some: { item: { submission: { sellerId } } } },
      },
      orderBy: { paidAt: "desc" },
      include: {
        orderItems: {
          where: { item: { submission: { sellerId } } },
          include: { item: { select: { title: true, photos: true, slug: true, agreedPayoutPrice: true, size: true } } },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.db.order.findUnique({
      where: { orderNumber },
      include: { orderItems: { include: { item: { select: { title: true, photos: true, retailPrice: true } } } } },
    });
  }

  async findByEmail(email: string) {
    return this.db.order.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      include: { orderItems: { include: { item: { select: { title: true, photos: true, retailPrice: true, slug: true } } } } },
    });
  }

  async findByGuestToken(token: string) {
    return this.db.order.findUnique({
      where: { guestToken: token },
      include: { orderItems: { include: { item: { select: { title: true, photos: true, retailPrice: true } } } } },
    });
  }

  async create(data: {
    guestToken?: string;
    buyerProfileId?: string;
    guestEmail?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    totalAmountKobo: number;
    paymentMethod: string;
    itemIds: string[];
    itemPrices: Array<{ itemId: string; priceKobo: number }>;
  }) {
    return this.db.order.create({
      data: {
        guestToken: data.guestToken,
        buyerProfileId: data.buyerProfileId,
        guestEmail: data.guestEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        totalAmountKobo: data.totalAmountKobo,
        paymentMethod: data.paymentMethod,
        orderItems: {
          create: data.itemPrices.map((ip) => ({
            itemId: ip.itemId,
            priceKobo: ip.priceKobo,
          })),
        },
      },
      include: { orderItems: { include: { item: true } } },
    });
  }

  async updateStatus(id: string, data: Record<string, unknown>) {
    return this.db.order.update({ where: { id }, data });
  }

  async findAll(page: number, limit: number, status?: string) {
    const where = status ? { status: status as Parameters<typeof this.db.order.findMany>[0] extends { where?: infer W } ? W extends Record<string, unknown> ? W["status"] : never : never } : {};
    const [items, total] = await Promise.all([
      this.db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { orderItems: { include: { item: { select: { title: true, photos: true, retailPrice: true } } } } },
      }),
      this.db.order.count({ where }),
    ]);
    return { items, total };
  }
}
