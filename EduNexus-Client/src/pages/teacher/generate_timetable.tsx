import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    Radio,
    RadioGroup,
    VStack,
    Select,
    Checkbox,
    Stack,
  } from "@chakra-ui/react";
  import { DeleteIcon } from "@chakra-ui/icons";
  import { useForm, useFieldArray, Controller } from "react-hook-form";
  
  interface SubjectData {
    subjectName: string;
    hoursPerWeek: string;
    mode: "theory" | "practical";
    labRequirement?: string;
    isTheory?: boolean;
    classAssignment?: string;
  }
  
  interface TeacherData {
    teacherName: string;
    preferredSlot: string;
    subjects: SubjectData[];
  }
  
  interface ClassData {
    className: string;
    subjects: string[];
  }
  
  interface TimetableFormData {
    start_time: string;
    end_time: string;
    classrooms: string;
    labs: string;
    teachers: TeacherData[];
    classes: ClassData[];
  }
  
  interface TeacherFormProps {
    teacherIndex: number;
    control: any;
    register: any;
    removeTeacher: (index: number) => void;
    labs: string[];
    classes: ClassData[];
    watch: any;
  }
  
  function TeacherForm({ 
    teacherIndex, 
    control, 
    register, 
    removeTeacher, 
    labs, 
    classes,
    watch 
  }: TeacherFormProps) {
    const {
      fields: subjectFields,
      append: appendSubject,
      remove: removeSubject,
    } = useFieldArray({
      control,
      name: `teachers.${teacherIndex}.subjects`,
    });
  
    const watchSubjects = watch(`teachers.${teacherIndex}.subjects`);
  
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <HStack justifyContent="space-between" mb={4}>
          <Box flex="1">
            <FormControl mb={2}>
              <FormLabel>Teacher ID:</FormLabel>
              <Input
                type="text"
                placeholder="Teacher ID (e.g., AF)"
                {...register(`teachers.${teacherIndex}.teacherName` as const)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Preferred Slot:</FormLabel>
              <Input
                type="text"
                placeholder="e.g., 9:00-10:30"
                {...register(`teachers.${teacherIndex}.preferredSlot` as const)}
              />
            </FormControl>
          </Box>
          <IconButton
            aria-label="Remove Teacher"
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            onClick={() => removeTeacher(teacherIndex)}
          />
        </HStack>
  
        <Heading as="h4" size="md" mb={2}>
          Subjects
        </Heading>
        <VStack spacing={3} align="stretch">
          {subjectFields.map((subject, subjectIndex) => (
            <Box key={subject.id} p={3} borderWidth="1px" borderRadius="md">
              <HStack spacing={4} align="end" mb={3}>
                <FormControl>
                  <FormLabel>Subject Code:</FormLabel>
                  <Input
                    type="text"
                    placeholder="e.g., LLM"
                    {...register(
                      `teachers.${teacherIndex}.subjects.${subjectIndex}.subjectName` as const
                    )}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Hours/Week:</FormLabel>
                  <Input
                    type="number"
                    placeholder="Hours"
                    {...register(
                      `teachers.${teacherIndex}.subjects.${subjectIndex}.hoursPerWeek` as const
                    )}
                  />
                </FormControl>
                <IconButton
                  aria-label="Delete Subject"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => removeSubject(subjectIndex)}
                />
              </HStack>
              
              <HStack spacing={4} align="start">
                <FormControl as="fieldset">
                  <FormLabel as="legend">Type:</FormLabel>
                  <Controller
                    control={control}
                    name={`teachers.${teacherIndex}.subjects.${subjectIndex}.mode` as const}
                    render={({ field }) => (
                      <RadioGroup {...field} defaultValue="theory">
                        <HStack spacing={2}>
                          <Radio value="theory">Theory</Radio>
                          <Radio value="practical">Practical</Radio>
                        </HStack>
                      </RadioGroup>
                    )}
                  />
                </FormControl>
                
                {watchSubjects && 
                 watchSubjects[subjectIndex]?.mode === "practical" && (
                  <FormControl>
                    <FormLabel>Lab Requirement:</FormLabel>
                    <Select
                      placeholder="Select lab"
                      {...register(
                        `teachers.${teacherIndex}.subjects.${subjectIndex}.labRequirement` as const
                      )}
                    >
                      {labs.map((lab) => (
                        <option key={lab} value={lab}>
                          {lab}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                <FormControl>
                  <FormLabel>Assign to Class:</FormLabel>
                  <Select
                    placeholder="Select class"
                    {...register(
                      `teachers.${teacherIndex}.subjects.${subjectIndex}.classAssignment` as const
                    )}
                  >
                    {classes.map((cls) => (
                      <option key={cls.className} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
            </Box>
          ))}
          <Button
            size="sm"
            colorScheme="teal"
            onClick={() =>
              appendSubject({
                subjectName: "",
                hoursPerWeek: "",
                mode: "theory",
                isTheory: true,
              })
            }
          >
            Add Subject
          </Button>
        </VStack>
      </Box>
    );
  }
  
  interface ClassFormProps {
    classIndex: number;
    control: any;
    register: any;
    removeClass: (index: number) => void;
  }
  
  function ClassForm({ classIndex, control, register, removeClass }: ClassFormProps) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <HStack justifyContent="space-between" mb={4}>
          <FormControl>
            <FormLabel>Class Name:</FormLabel>
            <Input
              type="text"
              placeholder="Class Name (e.g., TE, BE)"
              {...register(`classes.${classIndex}.className` as const)}
            />
          </FormControl>
          <IconButton
            aria-label="Remove Class"
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            onClick={() => removeClass(classIndex)}
          />
        </HStack>
      </Box>
    );
  }
  
  export default function TimetableForm() {
    const { register, handleSubmit, control, watch } = useForm<TimetableFormData>({
      defaultValues: {
        start_time: "08:30",
        end_time: "17:30",
        classrooms: "",
        labs: "",
        teachers: [
          {
            teacherName: "",
            preferredSlot: "",
            subjects: [
              {
                subjectName: "",
                hoursPerWeek: "",
                mode: "theory",
                isTheory: true,
              },
            ],
          },
        ],
        classes: [
          {
            className: "",
            subjects: [],
          },
        ],
      },
    });
  
    const watchLabs = watch("labs", "");
    const labsArray = watchLabs
      ? watchLabs
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      : [];
  
    const {
      fields: teacherFields,
      append: appendTeacher,
      remove: removeTeacher,
    } = useFieldArray({
      control,
      name: "teachers",
    });
  
    const {
      fields: classFields,
      append: appendClass,
      remove: removeClass,
    } = useFieldArray({
      control,
      name: "classes",
    });
  
    const onSubmit = async (data: TimetableFormData) => {
      // Transform form data to backend expected format:
      const teachers_subjects: { [teacher: string]: string[] } = {};
      const class_subjects: { [className: string]: string[] } = {};
      const hours_per_week: { [subject: string]: number } = {};
      const preferred_slots: { [teacher: string]: string } = {};
      const lab_requirements: { [subject: string]: string } = {};
      const theory_requirements: string[] = [];
  
      // Process teachers and their subjects
      data.teachers.forEach((teacher) => {
        if (teacher.teacherName.trim() !== "") {
          const subjectNames: string[] = [];
          
          teacher.subjects.forEach((subject) => {
            if (subject.subjectName.trim() !== "") {
              subjectNames.push(subject.subjectName);
              
              const hours = parseFloat(subject.hoursPerWeek);
              if (!isNaN(hours)) {
                hours_per_week[subject.subjectName] = hours;
              }
              
              // Add to theory requirements if it's a theory subject
              if (subject.mode === "theory") {
                if (!theory_requirements.includes(subject.subjectName)) {
                  theory_requirements.push(subject.subjectName);
                }
              }
              
              // Add lab requirements if it's a practical subject
              if (subject.mode === "practical" && subject.labRequirement) {
                lab_requirements[subject.subjectName] = subject.labRequirement;
              }
              
              // Add subject to class
              if (subject.classAssignment && subject.classAssignment.trim() !== "") {
                if (!class_subjects[subject.classAssignment]) {
                  class_subjects[subject.classAssignment] = [];
                }
                if (!class_subjects[subject.classAssignment].includes(subject.subjectName)) {
                  class_subjects[subject.classAssignment].push(subject.subjectName);
                }
              }
            }
          });
          
          teachers_subjects[teacher.teacherName] = subjectNames;
          if (teacher.preferredSlot.trim() !== "") {
            preferred_slots[teacher.teacherName] = teacher.preferredSlot;
          }
        }
      });
  
      // Process classes
      data.classes.forEach((cls) => {
        if (cls.className.trim() !== "" && !class_subjects[cls.className]) {
          class_subjects[cls.className] = [];
        }
      });
  
      // Convert comma-separated strings to arrays:
      const classrooms = data.classrooms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
        
      const labs = data.labs
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
  
      const payload = {
        teachers_subjects,
        class_subjects,
        hours_per_week,
        preferred_slots,
        classrooms,
        labs,
        lab_requirements,
        theory_requirements,
        start_time: data.start_time,
        end_time: data.end_time,
      };
  
      console.log(payload);
  
      try {
        const response = await fetch("/api/teacher/timetable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        if (response.ok) {
          // Assuming backend returns an Excel file:
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "timetable.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          console.error("Error generating timetable");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
  
    return (
      <Box p={6} maxW="5xl" mx="auto" bg="white" boxShadow="md" borderRadius="lg">
        <Heading as="h2" size="xl" mb={6}>
          Timetable Scheduling Form
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6} align="stretch">
            {/* Start and End Times */}
            <HStack spacing={4}>
              <FormControl id="start_time">
                <FormLabel>Start Time:</FormLabel>
                <Input type="time" {...register("start_time")} />
              </FormControl>
              <FormControl id="end_time">
                <FormLabel>End Time:</FormLabel>
                <Input type="time" {...register("end_time")} />
              </FormControl>
            </HStack>
  
            {/* Classrooms and Labs */}
            <HStack spacing={4}>
              <FormControl id="classrooms">
                <FormLabel>Classrooms (comma-separated):</FormLabel>
                <Input
                  type="text"
                  placeholder="43, 42"
                  {...register("classrooms")}
                />
              </FormControl>
              <FormControl id="labs">
                <FormLabel>Labs (comma-separated):</FormLabel>
                <Input type="text" placeholder="Lab1, Lab2" {...register("labs")} />
              </FormControl>
            </HStack>
  
            {/* Classes Section */}
            <Box>
              <Heading as="h3" size="lg" mb={4}>
                Classes
              </Heading>
              <VStack spacing={6} align="stretch">
                {classFields.map((cls, index) => (
                  <ClassForm
                    key={cls.id}
                    classIndex={index}
                    control={control}
                    register={register}
                    removeClass={removeClass}
                  />
                ))}
                <Button
                  colorScheme="purple"
                  onClick={() =>
                    appendClass({
                      className: "",
                      subjects: [],
                    })
                  }
                >
                  Add Class
                </Button>
              </VStack>
            </Box>
  
            {/* Teachers Section */}
            <Box>
              <Heading as="h3" size="lg" mb={4}>
                Teachers
              </Heading>
              <VStack spacing={6} align="stretch">
                {teacherFields.map((teacher, index) => (
                  <TeacherForm
                    key={teacher.id}
                    teacherIndex={index}
                    control={control}
                    register={register}
                    removeTeacher={removeTeacher}
                    labs={labsArray}
                    classes={classFields.map(field => field as unknown as ClassData)}
                    watch={watch}
                  />
                ))}
                <Button
                  colorScheme="blue"
                  onClick={() =>
                    appendTeacher({
                      teacherName: "",
                      preferredSlot: "",
                      subjects: [
                        {
                          subjectName: "",
                          hoursPerWeek: "",
                          mode: "theory",
                          isTheory: true,
                        },
                      ],
                    })
                  }
                >
                  Add Teacher
                </Button>
              </VStack>
            </Box>
  
            <Button type="submit" colorScheme="green" size="lg">
              Generate Timetable
            </Button>
          </VStack>
        </form>
      </Box>
    );
  }