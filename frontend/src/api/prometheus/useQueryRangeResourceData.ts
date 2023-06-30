import { TimeframeStep, TimeframeTimeRange } from '~/pages/modelServing/screens/const';
import { ContextResourceData, PrometheusQueryRangeResultValue } from '~/types';
import useRestructureContextResourceData from '~/utilities/useRestructureContextResourceData';
import { TimeframeTitle } from '~/pages/modelServing/screens/types';
import usePrometheusQueryRange, { ResponsePredicate } from './usePrometheusQueryRange';

const useQueryRangeResourceData = <T = PrometheusQueryRangeResultValue>(
  /** Is the query active -- should we be fetching? */
  active: boolean,
  query: string,
  end: number,
  timeframe: TimeframeTitle,
  responsePredicate: ResponsePredicate<T>,
): ContextResourceData<T> =>
  useRestructureContextResourceData<T>(
    usePrometheusQueryRange<T>(
      active,
      '/api/prometheus/serving',
      query,
      TimeframeTimeRange[timeframe],
      end,
      TimeframeStep[timeframe],
      responsePredicate,
    ),
  );

export default useQueryRangeResourceData;
