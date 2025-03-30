import { Navbar } from '../../components/navbar';
import {
  Box,
  Tabs, TabList, TabPanel, Tab, TabPanels
} from '@chakra-ui/react';
import StudentRegister from './StudentRegister';
import TeacherRegister from './TeacherRegister';
const Register = () => {
  return (
    <div>
      <Navbar />


      <Box mt={5}>
        <Tabs isFitted variant='enclosed' colorScheme='purple'>
          <TabList>
            <Tab _selected={{ bgColor: 'purple.600', color: 'white' }}>Teacher</Tab>
            <Tab _selected={{ bgColor: 'purple.600', color: 'white' }}>Student</Tab>
          </TabList>
          <TabPanels>
            <TabPanel bg={'purple.200'}>
              <TeacherRegister />
            </TabPanel>
            <TabPanel bg={'purple.200'}>
              <StudentRegister />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

    </div>

  );

}
export default Register;