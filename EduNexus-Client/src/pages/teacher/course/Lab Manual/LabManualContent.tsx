import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, Textarea } from '@chakra-ui/react';
import { LabrenderMarkdown } from '../renderMarkdown';

interface LabManualContentProps {
  markdownText: string;
  setMarkdownContent: React.Dispatch<React.SetStateAction<string>>;
  imageList: string[];
  setImageLists: React.Dispatch<React.SetStateAction<string[]>>;
}

const LabManualContent: React.FC<LabManualContentProps> = ({ markdownText, setMarkdownContent, imageList, setImageLists }) => {
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);

    setImageLists((prevImageList) => {
        const updatedImageList = [...prevImageList];

        const remainingImages = updatedImageList.filter((_, index) => {
            const identifier = `![image-${index}]`;
            return newContent.includes(identifier);
        });

        const newContentWithUpdatedIdentifiers = remainingImages.reduce((content, _, newIndex) => {
            const oldIdentifierPattern = new RegExp(`!\\[image-\\d+\\]`, 'g');
            return content.replace(oldIdentifierPattern, (_, offset) => {
                return `![image-${newIndex}]`;
            });
        }, newContent);

        setMarkdownContent(newContentWithUpdatedIdentifiers);

        return remainingImages;
    });
};

  return (
    <Box p={8} width={'full'} height={'100vh'} display="flex">
      <Tabs isFitted variant="enclosed" width={["80px", "200px", "full"]} p={2} overflow={'auto'}>
        <TabList mb="1em" border="none">
          <Tab
            bg="purple.400"
            _hover={{ border: 'none' }}
            _selected={{ bg: "purple.800", color: "white" }}
            color="white"
            className='main-heading'
            p={2}
            _focus={{ outline: 'none', boxShadow: 'none' }}
            fontSize={20}
            boxShadow={"lg"}
          >
            Write
          </Tab>
          <Tab
            _selected={{ bg: "purple.800", color: "white" }}
            color="white"
            _hover={{ border: 'none' }}
            bg="purple.400"
            className='main-heading'
            _focus={{ outline: 'none', boxShadow: 'none' }}
            p={2}
            boxShadow={"lg"}
            fontSize={20}
          >
            Preview
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Textarea
              id="lab-markdown-textarea"
              value={markdownText}
              onChange={handleContentChange}
              bg={'white'}
              borderRadius={"30"}
              p={8}
              _focus={{ outline: 'none', boxShadow: 'none' }}
              placeholder="Write your Markdown content here..."
              size="2xl"
              rows={22}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </TabPanel>

          <TabPanel>
            <Box bg={'white'} p={8} borderRadius={"30"}>
              {LabrenderMarkdown(markdownText, imageList)}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default LabManualContent;
