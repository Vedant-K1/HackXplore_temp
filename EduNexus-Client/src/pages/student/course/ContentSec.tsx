import { useState, useEffect } from 'react';
import { Box} from '@chakra-ui/react';
import { renderMarkdown } from './renderMarkdown';

interface ContentSecProps {
  contentData: { [submodule: string]: string }[];
  selectedSubmodule: string;
  imagelist: (string[])[];
}

const ContentSec: React.FC<ContentSecProps> = ({
  contentData,
  selectedSubmodule,
  imagelist,
}) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    const selected = contentData.find((item) => selectedSubmodule in item);
    if (selected) {
      setMarkdownContent(selected[selectedSubmodule]);
    }
  }, [selectedSubmodule, contentData]);

  return (
    <Box p={8} width={'full'} height={'98vh'} display="flex">
      <Box bg={'white'} p={8} borderRadius={"30"} overflow={"scroll"}>
        {renderMarkdown(markdownContent, imagelist)}
      </Box>
    </Box>
  );
};

export default ContentSec;
