import { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, Textarea } from '@chakra-ui/react';
import { debounce } from 'lodash';
import { renderMarkdown } from './renderMarkdown';

interface ContentSecProps {
  contentData: { [submodule: string]: string }[];
  selectedSubmodule: string;
  imagelist: (string[])[]; 
  setImageLists: React.Dispatch<React.SetStateAction<string[][]>>;
  onUpdateContent: (updatedContent: { [submodule: string]: string }[]) => void;
}

const ContentSec: React.FC<ContentSecProps> = ({
  contentData,
  selectedSubmodule,
  onUpdateContent,
  imagelist,
  setImageLists,
}) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  
  useEffect(() => {
    const selected = contentData.find((item) => selectedSubmodule in item);
    if (selected) {
      setMarkdownContent(selected[selectedSubmodule]);
    }
  }, [selectedSubmodule, contentData]);


  const debouncedUpdate = useCallback(
    debounce((updatedContent) => {
      onUpdateContent(updatedContent);
    }, 300),
    [onUpdateContent]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    setMarkdownContent(newContent);

    const updatedContent = contentData.map((item) =>
        selectedSubmodule in item
            ? { ...item, [selectedSubmodule]: newContent }
            : item
    );

    const submoduleIndex = contentData.findIndex((sub) => Object.keys(sub)[0] === selectedSubmodule);

    if (submoduleIndex !== -1) {
        setImageLists((prevImageLists) => {
            const updatedImageList = [...prevImageLists];
            const currentImageList = updatedImageList[submoduleIndex] || [];

            const remainingImages = currentImageList.filter((_, index) => {
                const identifier = `![image-${submoduleIndex}-${index}]`;
                return newContent.includes(identifier);
            });

            updatedImageList[submoduleIndex] = remainingImages;
            return updatedImageList;
        });
    }

    debouncedUpdate(updatedContent);
};



  return (
    <Box p={8} width={'full'} height={'100vh'} display="flex">
      <Tabs isFitted variant="enclosed" width={["80px", "200px", "full"]} p={2} overflow={'auto'}>
        <TabList mb="1em" border="none">
          <Tab
            borderLeftRadius={20}
            borderRightRadius={0}
            bg="purple.500"
            _hover={{ border: 'none' }}
            _selected={{ bg: "purple.800", color: "white" }}
            color="white"
            className='roboto-bold'
            p={2}
            _focus={{ outline: 'none', boxShadow: 'none' }}
            fontSize={20}
          >
            Write
          </Tab>
          <Tab
            _selected={{ bg: "purple.700", color: "white" }}
            color="white"
            _hover={{ border: 'none' }}
            borderLeftRadius={0}
            borderRightRadius={20}
            bg="purple.500"
            className='roboto-bold'
            _focus={{ outline: 'none', boxShadow: 'none' }}
            p={2}
            fontSize={20}
          >
            Preview
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Textarea
              id="markdown-textarea"
              value={markdownContent}
              bg={'white'}
              borderRadius={"30"}
              p={8}
              _focus={{ outline: 'none', boxShadow: 'none' }}
              onChange={handleContentChange}
              placeholder="Write your Markdown content here..."
              size="2xl"
              rows={22}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </TabPanel>

          <TabPanel>
            <Box bg={'white'} p={8} borderRadius={"30"}>
              {renderMarkdown(markdownContent,imagelist)}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ContentSec;
