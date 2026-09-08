import { useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '@brierb/brier-ui';
import { Menus } from './Menus';

export const Detail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (
    <Page
      header={
        <>
          <span className="cursor-pointer" onClick={() => navigate('/space/agents')}>
            Agents
          </span>
          <span className="">/</span>
          <span className="font-medium">{searchParams.get('agentName')}</span>
        </>
      }
    >
      <Menus />
    </Page>
  );
};

export default Detail;
