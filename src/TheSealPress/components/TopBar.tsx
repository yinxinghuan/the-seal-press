// AlterU brand strip + hairline divider — every screen has one.
import { memo } from 'react';

export default memo(function TopBar({ rightLabel }: { rightLabel: string }) {
  return (
    <>
      <div className="tsp-topbar">
        <div className="tsp-topbar__l">
          <span className="tsp-topbar__dot" />
          ALTERU · SEAL PRESS
        </div>
        <div className="tsp-topbar__r">{rightLabel}</div>
      </div>
      <div className="tsp-toprule" />
    </>
  );
});
