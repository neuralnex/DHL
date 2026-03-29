import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("shipments")
export class Shipment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ name: "tracking_number", type: "varchar", length: 32 })
  trackingNumber!: string;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ name: "origin_label", type: "text" })
  originLabel!: string;

  @Column({ name: "destination_label", type: "text" })
  destinationLabel!: string;

  @Column({ name: "receiver_email", type: "varchar", length: 320 })
  receiverEmail!: string;

  @Column({ name: "sender_email", type: "varchar", length: 320, nullable: true })
  senderEmail!: string | null;

  @Column({ name: "weight_kg", type: "double precision" })
  weightKg!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "estimated_delivery_at", type: "timestamptz" })
  estimatedDeliveryAt!: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @Index({ unique: true })
  @Column({ name: "reference_code", type: "varchar", length: 48, nullable: true })
  referenceCode!: string | null;

  @Column({ name: "customer_name", type: "varchar", length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: "service_level", type: "varchar", length: 64, nullable: true })
  serviceLevel!: string | null;

  @Column({ name: "internal_notes", type: "text", nullable: true })
  internalNotes!: string | null;

  @OneToMany(() => RouteSegment, (s) => s.shipment, { cascade: true })
  segments!: RouteSegment[];

  @OneToMany(() => TrackingEvent, (e) => e.shipment, { cascade: true })
  events!: TrackingEvent[];
}

export type GeoLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

@Entity("route_segments")
export class RouteSegment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Shipment, (s) => s.segments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "shipment_id" })
  shipment!: Shipment;

  @Column({ name: "shipment_id", type: "uuid" })
  shipmentId!: string;

  @Column({ type: "int" })
  sequence!: number;

  @Column({ type: "varchar", length: 16 })
  mode!: "road" | "air";

  @Column({ name: "from_label", type: "text" })
  fromLabel!: string;

  @Column({ name: "to_label", type: "text" })
  toLabel!: string;

  @Column({ type: "jsonb" })
  path!: GeoLineString;

  @Column({ name: "distance_km", type: "double precision" })
  distanceKm!: number;

  @Column({ name: "duration_minutes", type: "int" })
  durationMinutes!: number;
}

@Entity("tracking_events")
export class TrackingEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Shipment, (s) => s.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "shipment_id" })
  shipment!: Shipment;

  @Column({ name: "shipment_id", type: "uuid" })
  shipmentId!: string;

  @Column({ name: "segment_sequence", type: "int", nullable: true })
  segmentSequence!: number | null;

  @Column({ type: "varchar", length: 64 })
  code!: string;

  @Column({ type: "text" })
  label!: string;

  @Column({ name: "occurred_at", type: "timestamptz" })
  occurredAt!: Date;

  @Column({ name: "notify_email", type: "boolean", default: false })
  notifyEmail!: boolean;

  @Column({ name: "sort_order", type: "int" })
  sortOrder!: number;

  @Column({ type: "varchar", length: 16, default: "system" })
  source!: "system" | "admin";
}

@Entity("smtp_settings")
export class SmtpSettings {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  host!: string;

  @Column({ type: "int" })
  port!: number;

  @Column({ type: "boolean", default: false })
  secure!: boolean;

  @Column({ type: "varchar", length: 320 })
  user!: string;

  @Column({ name: "password_encrypted", type: "text", nullable: true })
  passwordEncrypted!: string | null;

  @Column({ name: "from_email", type: "varchar", length: 320 })
  fromEmail!: string;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

@Entity("notification_logs")
export class NotificationLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => TrackingEvent, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tracking_event_id" })
  event!: TrackingEvent;

  @Column({ name: "tracking_event_id", type: "uuid" })
  trackingEventId!: string;

  @Column({ type: "varchar", length: 16 })
  channel!: "email";

  @Column({ type: "varchar", length: 16 })
  status!: "pending" | "sent" | "failed";

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;
}
