import VotingForm from './components/VotingForm';
import {getPublicData} from '../lib/db';
export const dynamic = 'force-dynamic';
export default async function Home() {
  let data;
  let dataError = false;
  try { data = await getPublicData(); }
  catch (error) {
    console.error('Public data error:',error);
    data = {programs:[],groups:[],voters:[],assistants:[],votingOpen:false,demo:false};
    dataError = true;
  }
  return <VotingForm data={data} dataError={dataError}/>;
}
