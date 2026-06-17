import { z } from 'zod';

export const SolarTimeSchema = z.object({
  time: z
    .string()
    .min(1)
    .describe(
      '时间输入，支持格式：具体时间(14:30)、时间范围(13-15, 取中间值14:00)、时辰(丑时, 不进行真太阳时修正)',
    ),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')
    .describe('日期，格式 YYYY-MM-DD'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('经度（东经为正，西经为负）。AI 应根据用户提供的城市名自行推断，如北京≈116.4、上海≈121.5、台北≈121.6。'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe('纬度（北纬为正，南纬为负）。可选。AI 应根据用户提供的城市名自行推断，如北京≈39.9、上海≈31.2、台北≈25.0。'),
  birthplace: z.string().optional().describe(
    '出生地（仅供参考，不参与服务端计算）。AI 应根据此城市名自行推断经纬度，并通过 longitude/latitude 参数传入。',
  ),
  useSolarTime: z
    .boolean()
    .optional()
    .default(false)
    .describe('是否启用真太阳时修正，默认 false 不启用修正'),
});

export type SolarTimeInput = z.infer<typeof SolarTimeSchema>;
