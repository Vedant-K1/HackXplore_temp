import { HStack} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Navbar } from "../../../components/navbar"
import axios from 'axios';
import { useSessionCheck } from "../home/useSessionCheck";
import ChatWidget from '../../../components/ChatWidget';
import { useTranslation } from "react-i18next";
import { Sidebar } from './Sidebar';
import { ContentSec } from './ContentSec';

interface Subsection {
  title: string;
  content: string;
}

interface Subject {
  subject_name: string;
  title_for_the_content: string;
  content: string;
  subsections: Subsection[];
  urls: string[];
}

const Content = () => {
  useSessionCheck();
  const [data, setData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>(data.length > 0 ? data[0] : undefined);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizdata, setQuizData] = useState(null);
  const [quiz2data, setQuiz2Data] = useState(null);
  const [quiz3data, setQuiz3Data] = useState(null);
  const { t, i18n } = useTranslation();




  useEffect(() => {
    const fetchData = async () => {
      const moduleid = localStorage.getItem('moduleid') || undefined;
      const websearch = localStorage.getItem('websearch') || undefined;
      const source_lang = localStorage.getItem('source_lang') || undefined;

      i18n.changeLanguage(source_lang);
      try {
        const response = await axios.get(`/api/student/query2/${moduleid}/${source_lang}/${websearch}`);
        setImages(response.data.images);
        setVideos(response.data.videos);
        setData(response.data.content);
        setSelectedSubject(response.data.content.length > 0 ? response.data.content[0] : null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  return (
    <>
      <Navbar />
      <HStack alignItems="flex-start" bg={"#F8F6F4"} height={'90vh'} width={'99vw'}>
          <Sidebar
            data={data}
            setSelectedSubject={setSelectedSubject}
            setCurrentIndex={setCurrentIndex}
            setQuizData={setQuizData}
            setQuiz2Data={setQuiz2Data}
            setQuiz3Data={setQuiz3Data}
            isLoading={isLoading}
            trans={t}

          />
          <ContentSec
            quiz={quizdata}
            quiz2={quiz2data}
            quiz3={quiz3data}
            subject={selectedSubject}
            isLoading={isLoading}
            images={images}
            videos={videos}
            data_len={data.length}
            index={currentIndex}
            trans={t}
          />
      </HStack>
      {currentIndex <= data.length - 1 && <ChatWidget />}
    </>
  );
};

export default Content;