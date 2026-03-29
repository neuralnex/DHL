import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  NotificationLog,
  RouteSegment,
  Shipment,
  SmtpSettings,
  TrackingEvent,
} from "./entities";

const entities = [
  Shipment,
  RouteSegment,
  TrackingEvent,
  NotificationLog,
  SmtpSettings,
];

let dataSource: DataSource | null = null;

export function createDataSource(): DataSource {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new DataSource({
    type: "postgres",
    url,
    entities,
    synchronize: process.env.TYPEORM_SYNC !== "false",
    logging: process.env.TYPEORM_LOGGING === "true",
  });
}

export async function getDataSource(): Promise<DataSource> {
  if (dataSource?.isInitialized) {
    return dataSource;
  }
  dataSource = createDataSource();
  return dataSource.initialize();
}

export async function resetDataSourceForTests(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
  }
}
