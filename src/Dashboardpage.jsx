import DashboardLayout from './Dashboardlayout';
import Mapview from './Mapview';

export default function DashboardPage({ user }) {
  return (
    <DashboardLayout user={user}>
      <Mapview />
    </DashboardLayout>
  );
}
