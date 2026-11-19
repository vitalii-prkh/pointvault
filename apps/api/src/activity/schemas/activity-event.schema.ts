import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ActivityEventType = 'check-in' | 'purchase';

/**
 * Telemetry event. `payload` is schemaless on purpose: each event type carries different fields, and new
 * types can be added without a migration.
 */
@Schema({
  collection: 'activity_events',
  timestamps: {
    createdAt: 'receivedAt',
    updatedAt: false,
  },
  versionKey: false,
  minimize: false,
})
export class ActivityEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ type: String, required: true, enum: ['check-in', 'purchase'] })
  type!: ActivityEventType;

  @Prop({ required: true, index: true })
  memberId!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload!: Record<string, unknown>;

  /**
   * Points awarded for this event, if any
   */
  @Prop()
  bonusPoints?: number;

  receivedAt!: Date;
}

export type ActivityEventDocument = HydratedDocument<ActivityEvent>;
export const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);

ActivityEventSchema.index({ memberId: 1, receivedAt: -1 });
