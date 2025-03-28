import { Box, Heading, Image } from '@chakra-ui/react';

export const renderMarkdown = (
    content: string,
    imageList: string[][]
): JSX.Element[] => {
    const lines = content.split('\n');
    const renderedContent: JSX.Element[] = [];
    const imagePattern = /!\[(.*?)\]/;

    lines.forEach((line, idx) => {
        const imageMatch = line.match(imagePattern);
        if (imageMatch) {
            const identifier = imageMatch[1];
            const match = identifier.match(/image-(\d+)-(\d+)/);
            if (match) {
                
                const submoduleIndex = parseInt(match[1], 10);
                const imageIndex = parseInt(match[2], 10);
                const imageUrl =imageList[submoduleIndex]?.[imageIndex] || '';
                if (imageUrl) {
                    renderedContent.push(
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            mx={4}
                            key={`rendered-img-${idx}`}
                        >
                            <Image
                                src={imageUrl}
                                alt={identifier}
                                fit="contain"
                                boxSize={{ base: '100px', md: '300px', lg: '500px' }}
                            />
                        </Box>
                    );
                }
            }
        } else if (line.startsWith('## ')) {
            renderedContent.push(
                <Heading size={'md'} style={{ fontFamily: 'Rajdhani' }} key={idx} fontWeight="bold">
                    {line.slice(3)}
                </Heading>
            );
        } else if (line.startsWith('# ')) {
            renderedContent.push(
                <Heading size={'lg'} style={{ fontFamily: 'Rajdhani' }} key={idx}>
                    {line.slice(2)}
                </Heading>
            );
        } else if (line.startsWith('### ')) {
            renderedContent.push(
                <Heading size={'sm'} style={{ fontFamily: 'Rajdhani' }} key={idx} fontWeight="bold">
                    {line.slice(4)}
                </Heading>
            );
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            const boldPattern = /\*\*(.*?)\*\*/g;
            const formattedLine = line.slice(2).replace(boldPattern, (_, p1) => `<strong>${p1}</strong>`);
            renderedContent.push(
                <li
                    key={idx}
                    className="content"
                    style={{ marginLeft: '20px', listStyleType: 'disc' }}
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        } else {
            const boldPattern = /\*\*(.*?)\*\*/g;
            const formattedLine = line.replace(boldPattern, (_, p1) => `<strong>${p1}</strong>`);
            if (line.trim() === '') {
                renderedContent.push(<br key={idx} />);
            } else {
                renderedContent.push(
                    <p
                        key={idx}
                        className="content"
                        dangerouslySetInnerHTML={{
                            __html: formattedLine.replace(/\n/g, '<br />'),
                        }}
                    />
                );
            }
        }
    });

    return renderedContent;
};

export const LabrenderMarkdown = (
    content: string,
    imageList: string[]
): JSX.Element[] => {
    const lines = content.split('\n');
    const renderedContent: JSX.Element[] = [];
    const imagePattern = /!\[(.*?)\]/;

    lines.forEach((line, idx) => {
        const imageMatch = line.match(imagePattern);
        if (imageMatch) {
            const identifier = imageMatch[1];
            const match = identifier.match(/image-(\d+)/);
            if (match) {
                const imageIndex = parseInt(match[1], 10);
                const imageUrl = imageList[imageIndex] || '';
                if (imageUrl) {
                    renderedContent.push(
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            mx={4}
                            key={`rendered-img-${idx}`}
                        >
                            <Image
                                src={imageUrl}
                                alt={identifier}
                                fit="contain"
                                boxSize={{ base: '100px', md: '300px', lg: '500px' }}
                            />
                        </Box>
                    );
                }
            }
        } else if (line.startsWith('## ')) {
            renderedContent.push(
                <Heading size={'md'} style={{ fontFamily: 'Rajdhani' }} key={idx} fontWeight="bold">
                    {line.slice(3)}
                </Heading>
            );
        } else if (line.startsWith('# ')) {
            renderedContent.push(
                <Heading size={'lg'} style={{ fontFamily: 'Rajdhani' }} key={idx}>
                    {line.slice(2)}
                </Heading>
            );
        } else if (line.startsWith('### ')) {
            renderedContent.push(
                <Heading size={'sm'} style={{ fontFamily: 'Rajdhani' }} key={idx} fontWeight="bold">
                    {line.slice(4)}
                </Heading>
            );
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            const boldPattern = /\*\*(.*?)\*\*/g;
            const formattedLine = line.slice(2).replace(boldPattern, (_, p1) => `<strong>${p1}</strong>`);
            renderedContent.push(
                <li
                    key={idx}
                    className="content"
                    style={{ marginLeft: '20px', listStyleType: 'disc' }}
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        } else {
            const boldPattern = /\*\*(.*?)\*\*/g;
            const formattedLine = line.replace(boldPattern, (_, p1) => `<strong>${p1}</strong>`);
            if (line.trim() === '') {
                renderedContent.push(<br key={idx} />);
            } else {
                renderedContent.push(
                    <p
                        key={idx}
                        className="content"
                        dangerouslySetInnerHTML={{
                            __html: formattedLine.replace(/\n/g, '<br />'),
                        }}
                    />
                );
            }
        }
    });

    return renderedContent;
};

